using System.Net.Mail;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Mail;
using Umbraco.Cms.Core.Models.Email;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Extensions;
using umbraco_infoportal.Options;

namespace umbraco_infoportal.Controllers.ContactForm;

[ApiController]
[Route("api/contactform")]
public sealed class ContactFormController(
    IEmailSender emailSender,
    IPublishedContentCache publishedContentCache,
    IOptions<SupportEmailOptions> options,
    ILogger<ContactFormController> logger) : ControllerBase
{
    private const long MaxAttachmentBytes = 15L * 1024 * 1024;
    private const string ContactFormBlockAlias = "contactFormBlock";
    private const string SupportEmailPropertyAlias = "supportEmail";
    private const string GenericErrorMessage = "Unable to send contact form. Please try again later.";

    // TODO: TEMP — remove before merging. Extra recipients for local testing visibility.
    private static readonly string[] TempExtraRecipients = ["vu.quan@digdir.no", "quan.vu@knowit.no"];

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".bmp", ".jpg", ".jpeg", ".png", ".gif",
        ".txt", ".log", ".csv",
        ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".pdf", ".odt", ".ods", ".odp", ".rtf",
        ".rar", ".zip", ".7z",
        ".gdoc", ".gsheet", ".gslide",
        ".htm", ".html",
        ".eml", ".msg",
    };

    [HttpPost("send")]
    [IgnoreAntiforgeryToken]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20L * 1024 * 1024)]
    public async Task<IActionResult> Send([FromForm] ContactFormModel model, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(model.Location))
        {
            logger.LogWarning("Contact form rejected: honeypot triggered.");
            return BadRequest(new { success = false, errorMessage = GenericErrorMessage });
        }

        string? recipient = await ResolveRecipientAsync(model.SchemaId);
        if (string.IsNullOrEmpty(recipient))
        {
            return BadRequest(new { success = false, errorMessage = GenericErrorMessage });
        }

        string[] recipients = BuildRecipientList(recipient, TempExtraRecipients);

        if (!TryValidate(model, out CleanedFields fields, out string? validationError))
        {
            logger.LogWarning("Contact form rejected: {Reason}", validationError);
            return BadRequest(new { success = false, errorMessage = validationError });
        }

        Stream? attachmentStream = null;
        EmailMessageAttachment? emailAttachment = null;

        try
        {
            if (model.Attachment is { Length: > 0 } file)
            {
                if (file.Length > MaxAttachmentBytes)
                {
                    logger.LogWarning("Contact form rejected: attachment too large ({Size} bytes).", file.Length);
                    return BadRequest(new { success = false, errorMessage = "File is too large. Maximum size is 15 MB" });
                }

                string extension = Path.GetExtension(file.FileName);
                if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                {
                    logger.LogWarning("Contact form rejected: disallowed attachment extension {Extension}.", extension);
                    return BadRequest(new
                    {
                        success = false,
                        errorMessage = $"Invalid file type. Allowed types: {string.Join(", ", AllowedExtensions)}",
                    });
                }

                attachmentStream = file.OpenReadStream();
                emailAttachment = new EmailMessageAttachment(attachmentStream, file.FileName);
            }

            EmailMessage message = BuildMessage(fields, recipients, options.Value.FromAddress, emailAttachment);
            await emailSender.SendAsync(message, emailType: "ContactForm", enableNotification: false, expires: null);
            logger.LogInformation(
                "Contact form sent to {Recipients} for schemaId {SchemaId}.",
                string.Join(", ", recipients), model.SchemaId);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send contact form email.");
            return BadRequest(new { success = false, errorMessage = GenericErrorMessage });
        }
        finally
        {
            attachmentStream?.Dispose();
        }
    }

    private string[] BuildRecipientList(string blockRecipient, string[] additionalRecipients)
    {
        List<string> list = [blockRecipient];

        foreach (string candidate in additionalRecipients)
        {
            string trimmed = candidate?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(trimmed))
            {
                continue;
            }

            if (!MailAddress.TryCreate(trimmed, out _))
            {
                logger.LogWarning("Skipping invalid additional recipient: {Email}", trimmed);
                continue;
            }

            if (list.Any(r => string.Equals(r, trimmed, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            list.Add(trimmed);
        }

        return [.. list];
    }

    private async Task<string?> ResolveRecipientAsync(string? schemaId)
    {
        if (string.IsNullOrWhiteSpace(schemaId))
        {
            logger.LogWarning("Contact form rejected: schemaId missing.");
            return null;
        }

        if (!Guid.TryParse(schemaId.Trim(), out Guid blockKey))
        {
            logger.LogWarning("Contact form rejected: schemaId is not a GUID ({SchemaId}).", schemaId);
            return null;
        }

        IPublishedContent? block = await publishedContentCache.GetByIdAsync(blockKey, preview: false);
        if (block is null)
        {
            logger.LogWarning("Contact form rejected: no published content for {BlockKey}.", blockKey);
            return null;
        }

        if (!string.Equals(block.ContentType.Alias, ContactFormBlockAlias, StringComparison.Ordinal))
        {
            logger.LogWarning(
                "Contact form rejected: content {BlockKey} has alias '{Alias}', expected '{Expected}'.",
                blockKey, block.ContentType.Alias, ContactFormBlockAlias);
            return null;
        }

        string? email = block.Value<string>(SupportEmailPropertyAlias)?.Trim();
        if (string.IsNullOrEmpty(email))
        {
            logger.LogWarning("Contact form rejected: block {BlockKey} has empty supportEmail.", blockKey);
            return null;
        }

        if (!MailAddress.TryCreate(email, out _))
        {
            logger.LogWarning("Contact form rejected: block {BlockKey} supportEmail is not a valid email.", blockKey);
            return null;
        }

        return email;
    }

    private static bool TryValidate(ContactFormModel model, out CleanedFields fields, out string? error)
    {
        string name = (model.Name ?? string.Empty).Trim();
        if (name.Length < 2 || ContainsCrlf(name))
        {
            fields = default;
            error = "Name is required.";
            return false;
        }

        string email = (model.Email ?? string.Empty).Trim();
        if (ContainsCrlf(email) || !TryParseEmail(email))
        {
            fields = default;
            error = "A valid email address is required.";
            return false;
        }

        string phone = (model.Phone ?? string.Empty).Trim();
        if (phone.Length > 0 && !IsEightDigitPhone(phone))
        {
            fields = default;
            error = "Phone must be 8 digits.";
            return false;
        }

        string subject = (model.Subject ?? string.Empty).Trim();
        if (subject.Length < 3 || ContainsCrlf(subject))
        {
            fields = default;
            error = "Subject is required.";
            return false;
        }

        string body = (model.Message ?? string.Empty).Trim();
        if (body.Length < 1)
        {
            fields = default;
            error = "Message is required.";
            return false;
        }

        fields = new CleanedFields(name, email, phone, subject, body);
        error = null;
        return true;
    }

    private static EmailMessage BuildMessage(
        CleanedFields fields,
        string[] recipients,
        string fromAddress,
        EmailMessageAttachment? attachment)
    {
        HtmlEncoder encoder = HtmlEncoder.Default;

        string body =
            $"<p>Emne: {encoder.Encode(fields.Subject)}<br/>" +
            $"Spørsmål: {encoder.Encode(fields.Message)}<br/>" +
            $"Navn: {encoder.Encode(fields.Name)}<br/>" +
            $"Telefon: {encoder.Encode(fields.Phone)}<br/>" +
            $"E-post: <a href=\"mailto:{encoder.Encode(fields.Email)}\">{encoder.Encode(fields.Email)}</a></p>";

        string?[] to = new string?[recipients.Length];
        Array.Copy(recipients, to, recipients.Length);

        return new EmailMessage(
            from: fromAddress,
            to: to,
            cc: null,
            bcc: null,
            replyTo: new[] { fields.Email },
            subject: fields.Subject,
            body: body,
            isBodyHtml: true,
            attachments: attachment is null ? null : new[] { attachment });
    }

    private static bool TryParseEmail(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return false;
        }

        try
        {
            MailAddress address = new(value);
            return string.Equals(address.Address, value, StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static bool ContainsCrlf(string value) =>
        value.IndexOfAny(['\r', '\n']) >= 0;

    private static bool IsEightDigitPhone(string value)
    {
        if (value.Length != 8)
        {
            return false;
        }

        foreach (char c in value)
        {
            if (!char.IsDigit(c))
            {
                return false;
            }
        }

        return true;
    }

    private readonly record struct CleanedFields(
        string Name,
        string Email,
        string Phone,
        string Subject,
        string Message);
}

using System.Net.Mail;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Mail;
using Umbraco.Cms.Core.Models.Blocks;
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
    IDocumentCacheService documentCacheService,
    IPublishedContentTypeCache publishedContentTypeCache,
    IOptions<SupportEmailOptions> options,
    ILogger<ContactFormController> logger) : ControllerBase
{
    private const long MaxAttachmentBytes = 15L * 1024 * 1024;
    private const string ContactFormBlockAlias = "contactFormBlock";
    private const string ContactFormPageAlias = "contactFormPage";
    private const string SupportEmailPropertyAlias = "supportEmail";
    private const string FormTypeAreaPropertyAlias = "formTypeArea";
    private const string GenericErrorMessage = "Unable to send contact form. Please try again later.";

    // TODO: TEMP — remove before merging. Extra recipients for local testing visibility.
    private static readonly string[] TempExtraRecipients = ["vu.quan@digdir.no", "quan.vu@knowit.no"];

    // TODO: TEMP — remove before merging. Fallback used when block resolution fails,
    // so test submissions still produce an email instead of a 400. Points at a test
    // address only — never a production support inbox.
    private const string TempFallbackRecipient = "quan.vu@knowit.no";

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
            return BadRequest(new
            {
                success = false,
                errorMessage = GenericErrorMessage,
                // TODO: TEMP — debug surface for the test deploy, remove before prod merge.
                debug = new { stage = "honeypot" },
            });
        }

        (string? recipient, string? resolveFailureStage) = await ResolveRecipientAsync(model.SchemaId);
        bool usedFallbackRecipient = false; // TODO: TEMP — for test deploy visibility.
        if (string.IsNullOrEmpty(recipient))
        {
            // TODO: TEMP — remove fallback before merging. Lets test submissions
            // still produce an email when the Umbraco block lookup fails.
            logger.LogWarning(
                "Contact form: block resolution failed ({Stage}) for schemaId {SchemaId}; using temp fallback recipient.",
                resolveFailureStage, SanitizeForLog(model.SchemaId));
            recipient = TempFallbackRecipient;
            usedFallbackRecipient = true;
        }

        string[] recipients = BuildRecipientList(recipient, TempExtraRecipients);

        if (!TryValidate(model, out CleanedFields fields, out string? validationError))
        {
            logger.LogWarning("Contact form rejected: {Reason}", validationError);
            return BadRequest(new
            {
                success = false,
                errorMessage = validationError,
                // TODO: TEMP — debug surface for the test deploy, remove before prod merge.
                debug = new { stage = "validation" },
            });
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
                    return BadRequest(new
                    {
                        success = false,
                        errorMessage = "File is too large. Maximum size is 15 MB",
                        // TODO: TEMP — debug surface for the test deploy, remove before prod merge.
                        debug = new { stage = "attachment-size", attachmentBytes = file.Length },
                    });
                }

                string extension = Path.GetExtension(file.FileName);
                if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                {
                    logger.LogWarning("Contact form rejected: disallowed attachment extension {Extension}.", SanitizeForLog(extension));
                    return BadRequest(new
                    {
                        success = false,
                        errorMessage = $"Invalid file type. Allowed types: {string.Join(", ", AllowedExtensions)}",
                        // TODO: TEMP — debug surface for the test deploy, remove before prod merge.
                        debug = new { stage = "attachment-extension", extension = SanitizeForLog(extension) },
                    });
                }

                attachmentStream = file.OpenReadStream();
                emailAttachment = new EmailMessageAttachment(attachmentStream, file.FileName);
            }

            EmailMessage message = BuildMessage(fields, recipients, options.Value.FromAddress, emailAttachment);
            await emailSender.SendAsync(message, emailType: "ContactForm", enableNotification: false, expires: null);
            logger.LogInformation(
                "Contact form sent to {Recipients} for schemaId {SchemaId}.",
                string.Join(", ", recipients), SanitizeForLog(model.SchemaId));
            return Ok(new
            {
                success = true,
                // TODO: TEMP — debug surface for the test deploy, remove before prod merge.
                debug = new
                {
                    usedFallbackRecipient,
                    fallbackReason = usedFallbackRecipient ? resolveFailureStage : null,
                    recipientCount = recipients.Length,
                },
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send contact form email.");
            return BadRequest(new
            {
                success = false,
                errorMessage = GenericErrorMessage,
                // TODO: TEMP — debug surface for the test deploy, remove before prod merge.
                debug = new
                {
                    stage = "send",
                    exceptionType = ex.GetType().FullName,
                    exceptionMessage = ex.Message,
                },
            });
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

    // Returns (email, null) on success, or (null, failureStage) when resolution fails.
    // The failureStage string surfaces in the success response when fallback is used,
    // so testers can see in DevTools exactly why the lookup failed.
    private async Task<(string? Email, string? FailureStage)> ResolveRecipientAsync(string? schemaId)
    {
        if (string.IsNullOrWhiteSpace(schemaId))
        {
            logger.LogWarning("Contact form: schemaId missing.");
            return (null, "schemaId-missing");
        }

        if (!Guid.TryParse(schemaId.Trim(), out Guid blockKey))
        {
            logger.LogWarning("Contact form: schemaId is not a GUID ({SchemaId}).", SanitizeForLog(schemaId));
            return (null, "schemaId-not-guid");
        }

        IPublishedElement? block = await ResolveBlockElementAsync(blockKey);
        if (block is null)
        {
            logger.LogWarning(
                "Contact form: no contactFormBlock for {BlockKey} " +
                "(neither as a content node nor as a block-list element inside a contactFormPage).",
                blockKey);
            return (null, $"no-published-content:{blockKey}");
        }

        if (!string.Equals(block.ContentType.Alias, ContactFormBlockAlias, StringComparison.Ordinal))
        {
            logger.LogWarning(
                "Contact form: content {BlockKey} has alias '{Alias}', expected '{Expected}'.",
                blockKey, block.ContentType.Alias, ContactFormBlockAlias);
            return (null, $"wrong-content-type:{block.ContentType.Alias}");
        }

        string? email = block.Value<string>(SupportEmailPropertyAlias)?.Trim();
        if (string.IsNullOrEmpty(email))
        {
            logger.LogWarning("Contact form: block {BlockKey} has empty supportEmail.", blockKey);
            return (null, "empty-supportEmail");
        }

        if (!MailAddress.TryCreate(email, out _))
        {
            logger.LogWarning("Contact form: block {BlockKey} supportEmail is not a valid email.", blockKey);
            return (null, "invalid-supportEmail");
        }

        return (email, null);
    }

    // contactFormBlock can be either a top-level content node OR a block-list
    // element type embedded inside a contactFormPage's formTypeArea property.
    // IPublishedContentCache.GetByIdAsync only finds top-level nodes, so for the
    // block-list case we iterate every published contactFormPage and match by
    // element key.
    private async Task<IPublishedElement?> ResolveBlockElementAsync(Guid blockKey)
    {
        IPublishedContent? direct = await publishedContentCache.GetByIdAsync(blockKey, preview: false);
        if (direct is not null)
        {
            return direct;
        }

        IPublishedContentType? pageType = publishedContentTypeCache.Get(
            PublishedItemType.Content, ContactFormPageAlias);
        if (pageType is null)
        {
            return null;
        }

        foreach (IPublishedContent page in documentCacheService.GetByContentType(pageType))
        {
            BlockListModel? blocks = page.Value<BlockListModel>(FormTypeAreaPropertyAlias);
            if (blocks is null)
            {
                continue;
            }

            foreach (BlockListItem item in blocks)
            {
                if (item.Content.Key == blockKey)
                {
                    return item.Content;
                }
            }
        }

        return null;
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

    // Strip control characters and cap length so user-supplied values cannot
    // forge fake log lines (CRLF injection) or flood logs.
    private static string SanitizeForLog(string? value, int maxLength = 64)
    {
        if (string.IsNullOrEmpty(value))
        {
            return "<empty>";
        }

        string trimmed = value.Length > maxLength ? value[..maxLength] : value;
        return new string([.. trimmed.Where(c => !char.IsControl(c))]);
    }

    private readonly record struct CleanedFields(
        string Name,
        string Email,
        string Phone,
        string Subject,
        string Message);
}

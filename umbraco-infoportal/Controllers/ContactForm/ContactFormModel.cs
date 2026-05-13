using Microsoft.AspNetCore.Http;

namespace umbraco_infoportal.Controllers.ContactForm;

public sealed class ContactFormModel
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }

    public string? Location { get; set; }

    public string? SchemaId { get; set; }
    public string? Language { get; set; }
    public string? RecaptchaToken { get; set; }

    public IFormFile? Attachment { get; set; }
}

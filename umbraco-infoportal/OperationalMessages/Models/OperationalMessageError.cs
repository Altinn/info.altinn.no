namespace Infoportal.Cms.OperationalMessages.Models;

public enum OperationalMessageErrorKind
{
    /// <summary>The request itself is invalid (missing title, unknown colour …).</summary>
    Invalid,

    /// <summary>The editor lacks the permissions needed to do the same by hand.</summary>
    Forbidden,

    /// <summary>The start page has unpublished changes the editor has not agreed to publish.</summary>
    PendingStartPageChanges,

    /// <summary>The content tree is not set up as expected, or Umbraco refused to publish.</summary>
    Failed,
}

public sealed record OperationalMessageError(OperationalMessageErrorKind Kind, string Message);

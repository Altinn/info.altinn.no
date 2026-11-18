namespace Infoportal.Cms.OperationalMessages.Models;

public sealed class PublishOperationalMessageRequest
{
    public string? Title { get; init; }

    /// <summary>Rich text markup (HTML) from the dashboard's editor.</summary>
    public string? Description { get; init; }

    /// <summary>One of the colours configured on the "Operational message color" data type.</summary>
    public string? Color { get; init; }

    /// <summary>
    /// Must be true when the start page has unpublished changes, since republishing the
    /// start page publishes those changes too.
    /// </summary>
    public bool PublishPendingStartPageChanges { get; init; }
}

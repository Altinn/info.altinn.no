namespace Infoportal.Cms.OperationalMessages.Models;

/// <summary>Receipt shown in the dashboard after a successful publish.</summary>
public sealed record PublishedOperationalMessage(
    Guid Key,
    string Title,
    Guid StartPageKey,
    IReadOnlyList<string> StartPageCultures);

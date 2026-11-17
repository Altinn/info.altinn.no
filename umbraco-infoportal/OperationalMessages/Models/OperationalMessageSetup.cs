namespace Infoportal.Cms.OperationalMessages.Models;

/// <summary>What the dashboard needs before an editor fills in the form.</summary>
public sealed record OperationalMessageSetup(
    IReadOnlyList<string> Colors,
    bool StartPageHasPendingChanges);

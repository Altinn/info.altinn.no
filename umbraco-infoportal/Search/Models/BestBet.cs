namespace Infoportal.Cms.Search.Models;

public sealed record BestBet(
    string Title,
    IReadOnlyList<string> TriggerPhrases);

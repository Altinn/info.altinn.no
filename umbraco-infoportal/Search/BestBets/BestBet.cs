namespace umbraco_infoportal.Search.BestBets;

public sealed record BestBet(
    string Title,
    IReadOnlyList<string> TriggerPhrases);

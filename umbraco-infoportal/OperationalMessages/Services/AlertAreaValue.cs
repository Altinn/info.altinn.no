namespace Infoportal.Cms.OperationalMessages.Services;

/// <summary>
/// Reads and writes the stored value of the start page's <c>alertArea</c> property, a
/// multinode tree picker stored as a comma-separated list of document UDIs
/// (<c>umb://document/…</c>).
/// </summary>
public static class AlertAreaValue
{
    /// <summary>
    /// Returns the picker value with <paramref name="udi"/> first, followed by the existing
    /// references in their current order. Blank entries are dropped, and an existing
    /// reference to the same document is moved to the top rather than duplicated.
    /// </summary>
    public static string Prepend(string? storedValue, string udi)
    {
        var refs = new List<string> { udi };
        foreach (string entry in Split(storedValue))
        {
            if (!refs.Contains(entry, StringComparer.OrdinalIgnoreCase))
            {
                refs.Add(entry);
            }
        }

        return string.Join(',', refs);
    }

    private static IEnumerable<string> Split(string? storedValue) =>
        (storedValue ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

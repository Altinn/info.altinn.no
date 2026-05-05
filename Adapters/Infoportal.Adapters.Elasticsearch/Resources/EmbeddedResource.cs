using System.Reflection;

namespace Infoportal.Adapters.Elasticsearch.Resources;

internal static class EmbeddedResource
{
    private const string ResourceNamespace = "Infoportal.Adapters.Elasticsearch.Resources";

    public static string[] LoadLines(string fileName)
    {
        var assembly = typeof(EmbeddedResource).Assembly;
        var fullName = $"{ResourceNamespace}.{fileName}";

        using var stream = assembly.GetManifestResourceStream(fullName)
            ?? throw new InvalidOperationException(
                $"Embedded resource not found: {fullName}. " +
                $"Ensure the file is included as <EmbeddedResource> in the .csproj.");

        using var reader = new StreamReader(stream);
        var lines = new List<string>();
        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.StartsWith('#'))
                continue;
            lines.Add(trimmed);
        }
        return lines.ToArray();
    }
}

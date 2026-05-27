using System.Text.Json;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("https://localhost:5099");
builder.Logging.SetMinimumLevel(LogLevel.Warning);

WebApplication app = builder.Build();

app.MapPost("/client/v4/zones/{zoneId}/purge_cache", async (string zoneId, HttpRequest req) =>
{
    string body;
    using (StreamReader reader = new(req.Body))
    {
        body = await reader.ReadToEndAsync();
    }

    string auth = req.Headers.Authorization.ToString();
    string authDisplay = auth.Length >= 14
        ? $"{auth[..10]}...{auth[^4..]}"
        : (string.IsNullOrEmpty(auth) ? "<missing>" : "<short>");

    string prettyBody;
    try
    {
        using JsonDocument doc = JsonDocument.Parse(body);
        prettyBody = JsonSerializer.Serialize(doc, new JsonSerializerOptions { WriteIndented = true });
    }
    catch
    {
        prettyBody = body;
    }

    Console.WriteLine();
    Console.WriteLine("====================================================================");
    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] POST /client/v4/zones/{zoneId}/purge_cache");
    Console.WriteLine($"  Authorization: {authDisplay} (length={auth.Length})");
    Console.WriteLine("  Body:");
    foreach (string line in prettyBody.Split('\n'))
        Console.WriteLine($"    {line.TrimEnd('\r')}");
    Console.WriteLine("====================================================================");

    return Results.Json(new
    {
        result = new { id = Guid.NewGuid().ToString("N") },
        success = true,
        errors = Array.Empty<object>(),
        messages = Array.Empty<object>(),
    });
});

app.MapFallback((HttpRequest req) =>
{
    Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] UNHANDLED {req.Method} {req.Path}");
    return Results.NotFound();
});

Console.WriteLine("Cloudflare mock listening on https://localhost:5099");
Console.WriteLine("Press Ctrl+C to stop.");
app.Run();

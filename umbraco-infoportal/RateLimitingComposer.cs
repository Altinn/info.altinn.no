using Umbraco.Cms.Core.Composing;
using System.Threading.RateLimiting;
using Umbraco.Cms.Web.Common.ApplicationBuilder;

public class RateLimitingComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddRateLimiter(options =>
        {
            options.AddPolicy("Max100RequestsPerHour", _ =>
                RateLimitPartition.GetFixedWindowLimiter(
                    "global",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromHours(1),
                        QueueLimit = 0
                    }));

            options.OnRejected = async (context, cancellationToken) =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILogger<RateLimitingComposer>>();

                logger.LogError(
                    "Rate limit exceeded. Path: {Path}, IP: {IP}",
                    context.HttpContext.Request.Path,
                    context.HttpContext.Connection.RemoteIpAddress);

                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                await context.HttpContext.Response.WriteAsync(
                    "Rate limit exceeded",
                    cancellationToken);
            };                    
        });

        builder.Services.Configure<UmbracoPipelineOptions>(options =>
        {
            options.AddFilter(new UmbracoPipelineFilter("RateLimiter")
            {
                PostRouting = app =>
                {
                    app.UseRateLimiter();
                }
            });
        });
    }

    
}


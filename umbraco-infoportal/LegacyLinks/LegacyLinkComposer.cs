using Umbraco.Cms.Core.Composing;
using umbraco_infoportal.LegacyLinks.Jobs;

namespace umbraco_infoportal.LegacyLinks;

public class LegacyLinkComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<LegacyLinkBackgroundJob>();
        builder.Services.AddHostedService(sp => sp.GetRequiredService<LegacyLinkBackgroundJob>());
    }
}

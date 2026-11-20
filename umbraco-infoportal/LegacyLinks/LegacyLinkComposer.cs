using Umbraco.Cms.Core.Composing;
using Infoportal.Cms.LegacyLinks.Jobs;

namespace Infoportal.Cms.LegacyLinks;

public class LegacyLinkComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<LegacyLinkBackgroundJob>();
        builder.Services.AddHostedService(sp => sp.GetRequiredService<LegacyLinkBackgroundJob>());
    }
}

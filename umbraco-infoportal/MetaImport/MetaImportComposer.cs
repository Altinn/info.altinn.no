using Umbraco.Cms.Core.Composing;
using Infoportal.Cms.MetaImport.Jobs;

namespace Infoportal.Cms.MetaImport;

public class MetaImportComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<MetaImportBackgroundJob>();
        builder.Services.AddHostedService(sp => sp.GetRequiredService<MetaImportBackgroundJob>());
    }
}

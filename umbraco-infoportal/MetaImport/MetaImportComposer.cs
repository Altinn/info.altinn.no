using Umbraco.Cms.Core.Composing;
using umbraco_infoportal.MetaImport.Jobs;

namespace umbraco_infoportal.MetaImport;

public class MetaImportComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<MetaImportBackgroundJob>();
        builder.Services.AddHostedService(sp => sp.GetRequiredService<MetaImportBackgroundJob>());
    }
}

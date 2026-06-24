using umbraco_infoportal.ArticleExport.Services;
using Umbraco.Cms.Core.Composing;

namespace umbraco_infoportal.ArticleExport;

public class ArticleExportComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddScoped<ArticleReportGenerator>();
    }
}

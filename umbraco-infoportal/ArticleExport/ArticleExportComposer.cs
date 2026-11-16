using Umbraco.Cms.Core.Composing;
using Infoportal.Cms.ArticleExport.Services;

namespace Infoportal.Cms.ArticleExport;

public class ArticleExportComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddScoped<ArticleReportGenerator>();
    }
}

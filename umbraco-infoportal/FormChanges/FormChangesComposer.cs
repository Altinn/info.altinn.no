using Umbraco.Cms.Core.Composing;
using Infoportal.Cms.FormChanges.Services;

namespace Infoportal.Cms.FormChanges;

public class FormChangesComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddScoped<FormChangesReportService>();
    }
}

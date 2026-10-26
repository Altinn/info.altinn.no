using umbraco_infoportal.FormChanges.Services;
using Umbraco.Cms.Core.Composing;

namespace umbraco_infoportal.FormChanges;

public class FormChangesComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddScoped<FormChangesReportService>();
    }
}

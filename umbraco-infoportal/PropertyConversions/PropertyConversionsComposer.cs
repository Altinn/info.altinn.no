using Umbraco.Cms.Core.Composing;
using Infoportal.Cms.PropertyConversions.Services;

namespace Infoportal.Cms.PropertyConversions;

// The property value converters themselves are discovered by Umbraco automatically.
public class PropertyConversionsComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<MarkupFilter>();
    }
}

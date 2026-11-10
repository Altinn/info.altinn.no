using Umbraco.Cms.Core.Composing;

namespace Infoportal.Cms.Preview;

public class PreviewComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
        => builder.AddUrlProvider<PreviewUrlProvider>();
}

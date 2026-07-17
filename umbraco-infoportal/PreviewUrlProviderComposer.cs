	using Umbraco.Cms.Core.Composing;

	public class PreviewUrlProviderComposer : IComposer
	{
	    public void Compose(IUmbracoBuilder builder)
	        => builder.AddUrlProvider<PreviewUrlProvider>();
	}
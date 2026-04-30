using Umbraco.Cms.Core.DeliveryApi;

public class PurposeFilter : AbstractRelationFilter, IFilterHandler, IContentIndexHandler
{
    public PurposeFilter() : base("purpose", "purposes", ["subsidyPage"]) {}
}

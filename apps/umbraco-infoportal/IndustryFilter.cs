using Umbraco.Cms.Core.DeliveryApi;

public class IndustryFilter : AbstractRelationFilter, IFilterHandler, IContentIndexHandler
{
    public IndustryFilter() : base("industry", "industries", ["subsidyPage"]) {}
}
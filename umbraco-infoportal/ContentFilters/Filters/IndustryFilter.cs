using Umbraco.Cms.Core.DeliveryApi;

namespace Infoportal.Cms.ContentFilters.Filters;

public class IndustryFilter : AbstractRelationFilter, IFilterHandler, IContentIndexHandler
{
    public IndustryFilter() : base("industry", "industries", ["subsidyPage"]) {}
}
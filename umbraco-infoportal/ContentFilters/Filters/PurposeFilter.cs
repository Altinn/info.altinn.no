using Umbraco.Cms.Core.DeliveryApi;

namespace Infoportal.Cms.ContentFilters.Filters;

public class PurposeFilter : AbstractRelationFilter, IFilterHandler, IContentIndexHandler
{
    public PurposeFilter() : base("purpose", "purposes", ["subsidyPage"]) {}
}

using Umbraco.Cms.Core.DeliveryApi;

namespace Infoportal.Cms.ContentFilters.Filters;

public class SubCategoryFilter : AbstractRelationFilter, IFilterHandler, IContentIndexHandler
{
    public SubCategoryFilter() : base("subCategory", "subCategories", ["schemaPage", "schemaAttachmentPage", "schemaCollectionPage"]) {}
}
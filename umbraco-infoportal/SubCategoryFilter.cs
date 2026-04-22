using Umbraco.Cms.Core.DeliveryApi;

public class SubCategoryFilter : AbstractRelationFilter, IFilterHandler, IContentIndexHandler
{
    public SubCategoryFilter() : base("subCategory", "subCategories", ["schemaPage", "schemaAttachmentPage", "schemaCollectionPage"]) {}
}
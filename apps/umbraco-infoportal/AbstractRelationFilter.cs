using Umbraco.Cms.Core;
using Umbraco.Cms.Core.DeliveryApi;
using Umbraco.Cms.Core.Models;

public abstract class AbstractRelationFilter : IFilterHandler, IContentIndexHandler
{
    public string FilterName;
    public string FieldName;
    public string[] ContentTypes;

    public AbstractRelationFilter(string filterName, string fieldName, string[] contentTypes)
    {
        FilterName = filterName;
        FieldName = fieldName;
        ContentTypes = contentTypes;
    }

    // Querying
    public bool CanHandle(string query)
        => query.StartsWith(FilterName + ":", StringComparison.OrdinalIgnoreCase);

    public FilterOption BuildFilterOption(string filter)
    {
        return new FilterOption
        {
            FieldName = FieldName,
            Values = filter[(FilterName.Length + 1)..]
                .Split(",", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            Operator = FilterOperation.Contains
        };
    }

    // Indexing
    public IEnumerable<IndexFieldValue> GetFieldValues(IContent content, string? culture)
    {
        if (!ContentTypes.Contains(content.ContentType.Alias))
        {
            return [];
        }
        
        string? fieldValue = content.GetValue<string>(FieldName);

        if (fieldValue is null)
        {
            return [];
        }

        return
        [
            new IndexFieldValue
            {
                FieldName = FieldName,
                Values = ToGuidArray(fieldValue)
            }
        ];
    }

    public static object[] ToGuidArray(string rawContent)
    {
        List<object> guids = [];

        foreach (string udi in rawContent.Split(","))
        {
            Guid guid = new GuidUdi(new Uri(udi)).Guid; 
            guids.Add(guid);
        }

        return [..guids];
    }

    public IEnumerable<IndexField> GetFields() =>
    [
        new IndexField
        {
            FieldName = FieldName,
            FieldType = FieldType.StringRaw,
            VariesByCulture = false
        }
    ];
}

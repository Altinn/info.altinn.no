using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace umbraco_infoportal.CachePurge;

// Logs an error (not throws) for any AffectedUrlResolver.Rules key that doesn't match a
// real content type — content-type renames otherwise silently disable a rule.
public class RuleMapAliasValidator : INotificationHandler<UmbracoApplicationStartedNotification>
{
    private readonly IContentTypeService _contentTypeService;
    private readonly ILogger<RuleMapAliasValidator> _logger;

    public RuleMapAliasValidator(
        IContentTypeService contentTypeService,
        ILogger<RuleMapAliasValidator> logger)
    {
        _contentTypeService = contentTypeService;
        _logger = logger;
    }

    public void Handle(UmbracoApplicationStartedNotification notification)
    {
        HashSet<string> knownAliases = new(
            _contentTypeService.GetAll().Select(t => t.Alias),
            StringComparer.OrdinalIgnoreCase);

        foreach (string ruleAlias in AffectedUrlResolver.Rules.Keys)
        {
            if (!knownAliases.Contains(ruleAlias))
            {
                _logger.LogError(
                    "Cache-purge rule-map alias '{Alias}' not found in content types — rule will silently no-operation",
                    ruleAlias);
            }
        }

        _logger.LogInformation(
            "Cache-purge rule-map validated: {Total} rules, {Missing} missing aliases.",
            AffectedUrlResolver.Rules.Count,
            AffectedUrlResolver.Rules.Keys.Count(a => !knownAliases.Contains(a)));
    }
}

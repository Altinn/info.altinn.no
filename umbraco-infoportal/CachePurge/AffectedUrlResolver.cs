using Infoportal.Adapters.Cloudflare;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

namespace umbraco_infoportal.CachePurge;

// ForcePurgeEverything → call PurgeEverythingAsync, ignoring Urls.
public record AffectedUrlSet(IReadOnlyCollection<string> Urls, bool ForcePurgeEverything);

public class ContentTypeRule
{
    public bool IncludeTreeParent { get; init; }
    public bool IncludeTreeSiblings { get; init; }
    public string[] OutgoingPickerProperties { get; init; } = [];
    public string[] StaticUrls { get; init; } = [];
    public bool ForcePurgeEverything { get; init; }

    // Dirty properties that escalate to a whole-site purge (globalData header/footer fields).
    public string[] ForcePurgeEverythingOnDirtyProperties { get; init; } = [];

    // Cross-page purges (parent/siblings/pickers/static) fire only when one of these is dirty.
    public string[] CrossPagePurgeOnDirtyProperties { get; init; } = [];

    // Enumerate the whole subtree under the nearest ancestor of this alias (inclusive of self).
    public string IncludeAncestorSubtree { get; init; } = "";

    // Dirty properties that trigger IncludeAncestorSubtree (empty = always).
    public string[] IncludeAncestorSubtreeOnDirtyProperties { get; init; } = [];

    // Purge the nearest ancestor of this alias (the listing page) — unlike IncludeTreeParent
    // (first URL-bearing parent), this skips intermediate URL-bearing article levels.
    public string IncludeNearestAncestorOfType { get; init; } = "";
}

public class AffectedUrlResolver
{
    // CrossPagePurgeOnDirtyProperties lists the properties OTHER pages render about this type
    // (see astro-infoportal transformers). OrdinalIgnoreCase matches RuleMapAliasValidator.
    public static readonly Dictionary<string, ContentTypeRule> Rules = new(StringComparer.OrdinalIgnoreCase)
    {
        // Header/footer/banner properties render on every page → whole-site purge.
        ["startPage"] = new ContentTypeRule
        {
            ForcePurgeEverythingOnDirtyProperties = [
                "banner",
                "helpPage",
                "schemaReference",
                "startAndRunCompany",
                "aboutNewAltinnReference",
                "address1",
                "address2",
                "aboutAltinnReference",
                "operationalMessagesReference",
                "privacyReference",
                "accessibilityLocation",
            ],
        },

        // Drilldown pickers drive the sidebar on every help page → enumerate the help subtree.
        ["helpStartPage"] = new ContentTypeRule
        {
            IncludeAncestorSubtree = "helpStartPage",
            IncludeAncestorSubtreeOnDirtyProperties = ["newDrilldownPages", "oldDrilldownPages"],
        },

        // Name/akselIcon show in every help sidebar → subtree; triggerWords/altImage → helpStartPage only.
        ["helpDrilldownPage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name", "akselIcon", "triggerWords", "altImage"],
            IncludeAncestorSubtree = "helpStartPage",
            IncludeAncestorSubtreeOnDirtyProperties = ["Name", "akselIcon"],
        },

        ["schemaPage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            OutgoingPickerProperties = ["subCategories"],
            StaticUrls = ["/"],
            CrossPagePurgeOnDirtyProperties = ["Name", "schemaCode", "providers", "subCategories"],
        },
        ["schemaOverviewPage"] = new ContentTypeRule
        {
            StaticUrls = ["/"],
            CrossPagePurgeOnDirtyProperties = ["recommendedSchemas"],
        },
        ["subCategoryPage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            IncludeTreeSiblings = true,
            CrossPagePurgeOnDirtyProperties = ["Name"],
        },
        ["providerPage"] = new ContentTypeRule
        {
            StaticUrls = ["/skjemaoversikt/"],
            CrossPagePurgeOnDirtyProperties = ["Name", "providerAcronym", "providerOrgNr"],
        },
        ["categoryPage"] = new ContentTypeRule
        {
            IncludeTreeSiblings = true,
            StaticUrls = ["/skjemaoversikt/"],
            CrossPagePurgeOnDirtyProperties = ["Name", "icon"],
        },

        // schemaAttachmentPage: own URL only — SchemaPageTransformer doesn't render attachments.

        ["themePage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name"],
        },

        // No own URL (no transformer) — rule exists to purge the parent themePage on rename.
        ["themeContainerPage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name"],
        },

        // IncludeTreeParent walks up past the URL-less themeContainerPage to the themePage.
        ["articlePage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name", "mainIntro"],
        },
        // themePage lists its descendant sectionArticlePages at any depth (children + grandchildren
        // as links) — purge the ancestor themePage, which IncludeTreeParent alone misses for grandchildren.
        ["sectionArticlePage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name", "mainIntro", "showInNavigation"],
            IncludeNearestAncestorOfType = "themePage",
        },
        ["aboutPage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name", "mainIntro"],
        },
        ["subsidyPage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name", "mainIntro"],
        },
        ["helpLandingPage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name", "mainIntro"],
        },
        ["helpProcessArticlePage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name", "mainBody"],
        },
        ["helpQuestionPage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            CrossPagePurgeOnDirtyProperties = ["Name", "mainBody"],
        },
        // The sectionPage's "Siste nytt" block lists this archive's newest news (SectionPageTransformer
        // latestNewsBlock) → purge the ancestor sectionPage too, not just the archive + home.
        ["newsArticlePage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            StaticUrls = ["/"],
            IncludeNearestAncestorOfType = "sectionPage",
            CrossPagePurgeOnDirtyProperties = ["Name", "mainIntro", "lastChanged"],
        },

        // No gate — nearly every property feeds the archive + home renders.
        ["operationalMessageArticlePage"] = new ContentTypeRule
        {
            IncludeTreeParent = true,
            StaticUrls = ["/"],
        },
    };

    private readonly ContentUrlResolver _urlResolver;
    private readonly IContentService _contentService;
    private readonly IContentChangeTracker _changeTracker;
    private readonly IOptionsMonitor<CloudflareOptions> _options;
    private readonly ILogger<AffectedUrlResolver> _logger;

    public AffectedUrlResolver(
        ContentUrlResolver urlResolver,
        IContentService contentService,
        IContentChangeTracker changeTracker,
        IOptionsMonitor<CloudflareOptions> options,
        ILogger<AffectedUrlResolver> logger)
    {
        _urlResolver = urlResolver;
        _contentService = contentService;
        _changeTracker = changeTracker;
        _options = options;
        _logger = logger;
    }

    public AffectedUrlSet Resolve(IContent content, CachePurgeReason reason)
    {
        HashSet<string> urls = new(StringComparer.Ordinal);

        foreach (string u in _urlResolver.GetUrlsForAllCultures(content))
            urls.Add(u);

        if (Rules.TryGetValue(content.ContentType.Alias, out ContentTypeRule? matched))
        {
            if (matched.ForcePurgeEverything)
            {
                return new AffectedUrlSet(urls, ForcePurgeEverything: true);
            }

            foreach (string dirtyAlias in matched.ForcePurgeEverythingOnDirtyProperties)
            {
                if (IsDirtyAlias(content, dirtyAlias))
                {
                    _logger.LogInformation(
                        "Global property '{Alias}' dirty on content {ContentId} ({ContentType}) — escalating to purge_everything",
                        dirtyAlias, content.Id, content.ContentType.Alias);
                    return new AffectedUrlSet(urls, ForcePurgeEverything: true);
                }
            }
        }

        bool ruleApplied = ApplyRules(content, urls, reason);

        if (urls.Count == 0 && !ruleApplied)
        {
            _logger.LogInformation(
                "No URL or rule for content {ContentId} ({Alias}) — handler will call purge_everything",
                content.Id, content.ContentType.Alias);
            return new AffectedUrlSet(urls, ForcePurgeEverything: true);
        }

        bool exceedsThreshold = urls.Count > _options.CurrentValue.AffectedUrlThreshold;
        return new AffectedUrlSet(urls, ForcePurgeEverything: exceedsThreshold);
    }

    // Returns true if a rule matched (regardless of whether it added URLs).
    private bool ApplyRules(IContent content, HashSet<string> urls, CachePurgeReason reason)
    {
        if (!Rules.TryGetValue(content.ContentType.Alias, out ContentTypeRule? rule))
            return false;

        // Skip cross-page actions only on a Publish with nothing listing-relevant dirty (own URLs
        // already collected). Removal/reorder (Unpublish/Trash/Sort) always change a listing.
        if (reason == CachePurgeReason.Publish && rule.CrossPagePurgeOnDirtyProperties.Length > 0)
        {
            bool anyCrossPageDirty = false;
            foreach (string alias in rule.CrossPagePurgeOnDirtyProperties)
            {
                if (IsDirtyAlias(content, alias))
                {
                    anyCrossPageDirty = true;
                    break;
                }
            }
            if (!anyCrossPageDirty)
            {
                _logger.LogDebug(
                    "Content {ContentId} ({Alias}) — no cross-page property dirty on publish, skipping cross-page actions",
                    content.Id, content.ContentType.Alias);
                return true;
            }
        }

        string siteBaseUrl = _urlResolver.GetSiteBaseUrl();

        foreach (string staticPath in rule.StaticUrls)
        {
            urls.Add(ContentUrlResolver.CombineUrl(siteBaseUrl, staticPath));
        }

        if (rule.IncludeTreeParent && content.ParentId > 0)
        {
            // Walk up past URL-less transparent containers (e.g. themeContainerPage) to the
            // first ancestor that has URLs.
            IContent? parent = _contentService.GetById(content.ParentId);
            int safety = 8;
            while (parent != null && safety-- > 0)
            {
                List<string> parentUrls = _urlResolver.GetUrlsForAllCultures(parent).ToList();
                if (parentUrls.Count > 0)
                {
                    foreach (string u in parentUrls) urls.Add(u);
                    break;
                }
                if (parent.ParentId <= 0) break;
                parent = _contentService.GetById(parent.ParentId);
            }
        }

        if (!string.IsNullOrEmpty(rule.IncludeNearestAncestorOfType))
        {
            // The listing page renders this node at any depth; IncludeTreeParent stops at the
            // first URL-bearing parent and misses deeper listings (e.g. themePage grandchildren).
            IContent? listing = FindAncestorOfType(content, rule.IncludeNearestAncestorOfType);
            if (listing is not null)
            {
                foreach (string u in _urlResolver.GetUrlsForAllCultures(listing))
                    urls.Add(u);
            }
        }

        if (rule.IncludeTreeSiblings && content.ParentId > 0)
        {
            IEnumerable<IContent> siblings = _contentService.GetPagedChildren(
                content.ParentId, 0, int.MaxValue, out _,
                propertyAliases: null, filter: null, ordering: null);
            foreach (IContent sibling in siblings)
            {
                if (sibling.Id == content.Id) continue;
                foreach (string u in _urlResolver.GetUrlsForAllCultures(sibling))
                    urls.Add(u);
            }
        }

        foreach (string propertyAlias in rule.OutgoingPickerProperties)
        {
            string? raw = content.GetValue<string>(propertyAlias);
            if (string.IsNullOrWhiteSpace(raw)) continue;

            foreach (Guid referencedKey in ParseUdiGuids(raw))
            {
                IContent? referenced = _contentService.GetById(referencedKey);
                if (referenced == null) continue;
                foreach (string u in _urlResolver.GetUrlsForAllCultures(referenced))
                    urls.Add(u);
            }
        }

        if (!string.IsNullOrEmpty(rule.IncludeAncestorSubtree))
        {
            bool subtreeTriggered = rule.IncludeAncestorSubtreeOnDirtyProperties.Length == 0;
            if (!subtreeTriggered)
            {
                foreach (string alias in rule.IncludeAncestorSubtreeOnDirtyProperties)
                {
                    if (IsDirtyAlias(content, alias)) { subtreeTriggered = true; break; }
                }
            }

            if (subtreeTriggered)
            {
                IContent? ancestor = FindAncestorOfType(content, rule.IncludeAncestorSubtree);
                if (ancestor is null)
                {
                    _logger.LogWarning(
                        "IncludeAncestorSubtree configured but no ancestor of type '{Type}' found for content {ContentId} ({Alias})",
                        rule.IncludeAncestorSubtree, content.Id, content.ContentType.Alias);
                }
                else
                {
                    foreach (string u in _urlResolver.GetUrlsForAllCultures(ancestor))
                        urls.Add(u);

                    const int MaxDescendantsPerPublish = 5000;
                    IEnumerable<IContent> descendants = _contentService.GetPagedDescendants(
                        ancestor.Id, 0, MaxDescendantsPerPublish, out long total);
                    foreach (IContent d in descendants)
                    {
                        if (d.Id == content.Id) continue;
                        foreach (string u in _urlResolver.GetUrlsForAllCultures(d))
                            urls.Add(u);
                    }
                    _logger.LogInformation(
                        "Subtree enumeration: ancestor {AncestorId} ({AncestorType}) → {Count} descendants",
                        ancestor.Id, ancestor.ContentType.Alias, total);
                }
            }
        }

        return true;
    }

    private IContent? FindAncestorOfType(IContent content, string ancestorType)
    {
        IContent? current = content;
        int safety = 16;
        while (current is not null && safety-- > 0)
        {
            if (current.ContentType.Alias.Equals(ancestorType, StringComparison.OrdinalIgnoreCase))
                return current;
            if (current.ParentId <= 0) return null;
            current = _contentService.GetById(current.ParentId);
        }
        return null;
    }

    // "Name" is special-cased: WasPropertyDirty misses culture-variant renames, so
    // CachePurgeOnSavedHandler detects them and stashes the result in IContentChangeTracker.
    private bool IsDirtyAlias(IContent content, string alias)
    {
        if (!alias.Equals("Name", StringComparison.OrdinalIgnoreCase))
        {
            return content.WasPropertyDirty(alias);
        }

        if (content.WasPropertyDirty("Name")) return true;

        if (content.ContentType.VariesByCulture() && content.CultureInfos is not null)
        {
            foreach (var cultureInfo in content.CultureInfos)
            {
                if (cultureInfo.WasPropertyDirty("Name")) return true;
            }
        }

        return _changeTracker.ConsumeNameChanged(content.Id);
    }

    private IEnumerable<Guid> ParseUdiGuids(string rawContent)
    {
        foreach (string udiString in rawContent.Split(',', StringSplitOptions.RemoveEmptyEntries))
        {
            string trimmed = udiString.Trim();
            Guid? guid = null;
            try
            {
                guid = new GuidUdi(new Uri(trimmed)).Guid;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not parse UDI '{Udi}'", trimmed);
            }
            if (guid.HasValue) yield return guid.Value;
        }
    }
}

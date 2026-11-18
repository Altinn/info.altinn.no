using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Infoportal.Cms.OperationalMessages.Models;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.AuthorizationStatus;

namespace Infoportal.Cms.OperationalMessages.Services;

/// <summary>
/// Creates and publishes a driftsmelding in one go, and puts it first in the start page's
/// "Driftsmelding- og varselsområde" (<c>alertArea</c>), so editors don't have to go
/// through the content tree for an urgent message (issue #928).
/// </summary>
public partial class OperationalMessagePublisher
{
    public const string ArchivePageAlias = "operationalMessageArchivePage";
    public const string MessagePageAlias = "operationalMessageArticlePage";
    public const string StartPageAlias = "startPage";
    public const string ColorPropertyAlias = "colorVariant";
    public const string DescriptionPropertyAlias = "mainBodyRichText";
    public const string AlertAreaPropertyAlias = "alertArea";

    // Umbraco's limit for node names.
    public const int MaxTitleLength = 255;

    private readonly IContentService _contentService;
    private readonly IContentTypeService _contentTypeService;
    private readonly IDataTypeService _dataTypeService;
    private readonly ILanguageService _languageService;
    private readonly IContentPermissionService _permissionService;
    private readonly ICoreScopeProvider _scopeProvider;
    private readonly ILogger<OperationalMessagePublisher> _logger;

    public OperationalMessagePublisher(
        IContentService contentService,
        IContentTypeService contentTypeService,
        IDataTypeService dataTypeService,
        ILanguageService languageService,
        IContentPermissionService permissionService,
        ICoreScopeProvider scopeProvider,
        ILogger<OperationalMessagePublisher> logger)
    {
        _contentService = contentService;
        _contentTypeService = contentTypeService;
        _dataTypeService = dataTypeService;
        _languageService = languageService;
        _permissionService = permissionService;
        _scopeProvider = scopeProvider;
        _logger = logger;
    }

    public async Task<OperationalMessageSetup> GetSetupAsync()
    {
        IReadOnlyList<string> colors = await GetColorsAsync();
        IContent? startPage = FindStartPage();
        return new OperationalMessageSetup(colors, startPage?.Edited ?? false);
    }

    public async Task<(PublishedOperationalMessage? Message, OperationalMessageError? Error)> PublishAsync(
        PublishOperationalMessageRequest request, IUser user)
    {
        IReadOnlyList<string> colors = await GetColorsAsync();
        OperationalMessageError? invalid = Validate(request, colors);
        if (invalid is not null)
        {
            return (null, invalid);
        }

        int userId = user.Id;
        string title = request.Title!.Trim();
        string culture = await _languageService.GetDefaultIsoCodeAsync();

        using ICoreScope scope = _scopeProvider.CreateCoreScope();

        IContent? archive = FindSingle(ArchivePageAlias);
        if (archive is null)
        {
            return (null, Failed("Fant ikke driftsmeldingsarkivet i innholdstreet."));
        }

        IContent? startPage = FindStartPage();
        if (startPage is null)
        {
            return (null, Failed("Fant ikke startsiden i innholdstreet."));
        }

        string[] startPageCultures = startPage.PublishedCultures.ToArray();
        if (startPageCultures.Length == 0)
        {
            return (null, Failed("Startsiden er ikke publisert."));
        }

        if (!await IsAuthorizedAsync(user, archive, startPage, startPageCultures))
        {
            return (null, new OperationalMessageError(
                OperationalMessageErrorKind.Forbidden,
                "Du har ikke tilgang til å opprette og publisere driftsmeldinger og å publisere startsiden."));
        }

        if (startPage.Edited && !request.PublishPendingStartPageChanges)
        {
            return (null, new OperationalMessageError(
                OperationalMessageErrorKind.PendingStartPageChanges,
                "Startsiden har endringer som ikke er publisert. Disse blir publisert sammen med driftsmeldingen."));
        }

        IContent message = _contentService.Create(title, archive.Key, MessagePageAlias, userId);
        message.SetCultureName(title, culture);
        message.SetValue(ColorPropertyAlias, JsonSerializer.Serialize(new[] { request.Color }));
        message.SetValue(
            DescriptionPropertyAlias,
            JsonSerializer.Serialize(new { markup = request.Description, blocks = (object?)null }),
            culture);

        _contentService.Save(message, userId);
        PublishResult messageResult = _contentService.Publish(message, [culture], userId);
        if (!messageResult.Success)
        {
            return (null, Failed($"Kunne ikke publisere driftsmeldingen ({messageResult.Result})."));
        }

        string udi = Udi.Create(Constants.UdiEntityType.Document, message.Key).ToString();
        startPage.SetValue(
            AlertAreaPropertyAlias,
            AlertAreaValue.Prepend(startPage.GetValue<string>(AlertAreaPropertyAlias), udi));

        _contentService.Save(startPage, userId);
        PublishResult startPageResult = _contentService.Publish(startPage, startPageCultures, userId);
        if (!startPageResult.Success)
        {
            // Not completing the scope rolls back the new driftsmelding too.
            return (null, Failed($"Kunne ikke publisere startsiden ({startPageResult.Result})."));
        }

        scope.Complete();

        // The title is editor input, so it stays out of the log; the key identifies the message.
        _logger.LogInformation(
            "Driftsmelding {Key} published and added to the start page by user {UserId}",
            message.Key, userId);

        return (new PublishedOperationalMessage(message.Key, title, startPage.Key, startPageCultures), null);
    }

    /// <summary>Checks the form input. Returns null when it is valid.</summary>
    public static OperationalMessageError? Validate(
        PublishOperationalMessageRequest request, IReadOnlyCollection<string> allowedColors)
    {
        string title = request.Title?.Trim() ?? string.Empty;
        if (title.Length == 0)
        {
            return Invalid("Tittel må fylles ut.");
        }

        if (title.Length > MaxTitleLength)
        {
            return Invalid($"Tittel kan ikke være lengre enn {MaxTitleLength} tegn.");
        }

        if (IsBlankMarkup(request.Description))
        {
            return Invalid("Beskrivelse må fylles ut.");
        }

        if (string.IsNullOrWhiteSpace(request.Color) || !allowedColors.Contains(request.Color))
        {
            return Invalid("Velg en gyldig kritikalitet.");
        }

        return null;
    }

    /// <summary>True when rich text markup has no visible text, e.g. "&lt;p&gt;&lt;/p&gt;".</summary>
    public static bool IsBlankMarkup(string? markup)
    {
        if (string.IsNullOrWhiteSpace(markup))
        {
            return true;
        }

        if (EmbeddedContent().IsMatch(markup))
        {
            return false;
        }

        string text = WebUtility.HtmlDecode(Tags().Replace(markup, string.Empty));
        return string.IsNullOrWhiteSpace(text);
    }

    // The same permissions the editor would need to do this by hand in the content tree.
    private async Task<bool> IsAuthorizedAsync(
        IUser user, IContent archive, IContent startPage, IEnumerable<string> startPageCultures)
    {
        ContentAuthorizationStatus archiveAccess = await _permissionService.AuthorizeAccessAsync(
            user, [archive.Key], new HashSet<string> { ActionNew.ActionLetter, ActionPublish.ActionLetter });
        ContentAuthorizationStatus startPageAccess = await _permissionService.AuthorizeAccessAsync(
            user, [startPage.Key], new HashSet<string> { ActionUpdate.ActionLetter, ActionPublish.ActionLetter });
        ContentAuthorizationStatus cultureAccess = await _permissionService.AuthorizeCultureAccessAsync(
            user, startPageCultures.ToHashSet(StringComparer.OrdinalIgnoreCase));

        return archiveAccess == ContentAuthorizationStatus.Success
            && startPageAccess == ContentAuthorizationStatus.Success
            && cultureAccess == ContentAuthorizationStatus.Success;
    }

    private async Task<IReadOnlyList<string>> GetColorsAsync()
    {
        IContentType? messageType = _contentTypeService.Get(MessagePageAlias);
        IPropertyType? colorProperty = messageType?.CompositionPropertyTypes
            .FirstOrDefault(p => p.Alias == ColorPropertyAlias);
        if (colorProperty is null)
        {
            return [];
        }

        IDataType? dataType = await _dataTypeService.GetAsync(colorProperty.DataTypeKey);
        return dataType?.ConfigurationObject is ValueListConfiguration config
            ? config.Items.ToList()
            : [];
    }

    // The start page at the root of the tree; the site has a single one.
    private IContent? FindStartPage() =>
        _contentService.GetRootContent()
            .Where(c => c.ContentType.Alias == StartPageAlias && !c.Trashed)
            .OrderBy(c => c.SortOrder)
            .FirstOrDefault()
        ?? FindSingle(StartPageAlias);

    private IContent? FindSingle(string contentTypeAlias)
    {
        IContentType? contentType = _contentTypeService.Get(contentTypeAlias);
        if (contentType is null)
        {
            return null;
        }

        List<IContent> matches = _contentService
            .GetPagedOfType(contentType.Id, 0, 10, out _, null, null)
            .Where(c => !c.Trashed)
            .OrderBy(c => c.Level)
            .ThenBy(c => c.SortOrder)
            .ToList();

        if (matches.Count > 1)
        {
            _logger.LogWarning(
                "Found {Count} nodes of type {Alias}; using {Key}",
                matches.Count, contentTypeAlias, matches[0].Key);
        }

        return matches.FirstOrDefault();
    }

    private static OperationalMessageError Invalid(string message) =>
        new(OperationalMessageErrorKind.Invalid, message);

    private static OperationalMessageError Failed(string message) =>
        new(OperationalMessageErrorKind.Failed, message);

    [GeneratedRegex("<[^>]*>")]
    private static partial Regex Tags();

    [GeneratedRegex("<(img|iframe|video|embed|object)\\b", RegexOptions.IgnoreCase)]
    private static partial Regex EmbeddedContent();
}

using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;

namespace umbraco_infoportal.Migrations;

/// <summary>
/// Runs <see cref="InfoportalMigrationPlan"/> on startup.
/// </summary>
/// <remarks>
/// Umbraco publishes this notification after its own unattended upgrade has completed and the runtime
/// level has been re-determined, so on the boot that upgrades the database our migrations run straight
/// after Umbraco's.
/// </remarks>
public class RunInfoportalMigrations : INotificationAsyncHandler<UmbracoApplicationStartingNotification>
{
    private readonly ICoreScopeProvider _coreScopeProvider;
    private readonly IKeyValueService _keyValueService;
    private readonly ILogger<RunInfoportalMigrations> _logger;
    private readonly IMigrationPlanExecutor _migrationPlanExecutor;

    public RunInfoportalMigrations(
        ICoreScopeProvider coreScopeProvider,
        IKeyValueService keyValueService,
        ILogger<RunInfoportalMigrations> logger,
        IMigrationPlanExecutor migrationPlanExecutor)
    {
        _coreScopeProvider = coreScopeProvider;
        _keyValueService = keyValueService;
        _logger = logger;
        _migrationPlanExecutor = migrationPlanExecutor;
    }

    public async Task HandleAsync(
        UmbracoApplicationStartingNotification notification,
        CancellationToken cancellationToken)
    {
        if (notification.RuntimeLevel != RuntimeLevel.Run)
        {
            _logger.LogInformation(
                "Skipping the Infoportal migration plan because the runtime level is {RuntimeLevel}.",
                notification.RuntimeLevel);
            return;
        }

        ExecutedMigrationPlan executedPlan = await new Upgrader(new InfoportalMigrationPlan())
            .ExecuteAsync(_migrationPlanExecutor, _coreScopeProvider, _keyValueService);

        if (executedPlan.Successful)
        {
            _logger.LogInformation(
                "The Infoportal migration plan completed at state {FinalState}.",
                executedPlan.FinalState);
            return;
        }

        _logger.LogError(
            executedPlan.Exception,
            "The Infoportal migration plan failed and stopped at state {FinalState}.",
            executedPlan.FinalState);
    }
}

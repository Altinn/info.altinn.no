using Umbraco.Cms.Infrastructure.Migrations;

namespace umbraco_infoportal.Migrations;

/// <summary>
/// The migration plan for infoportal's own migrations, kept separate from Umbraco's core plan.
/// </summary>
/// <remarks>
/// The reached state is persisted in umbracoKeyValue under
/// <c>Umbraco.Core.Upgrader.State+Infoportal</c>, so each migration below runs exactly once per
/// environment. Only ever append new states — rewriting or removing an existing one leaves
/// environments stranded on a state this plan can no longer resolve.
/// </remarks>
public class InfoportalMigrationPlan : MigrationPlan
{
    public InfoportalMigrationPlan()
        : base("Infoportal")
    {
        From(string.Empty)
            .To<NormalizeLegacyBlockUdisMigration>("normalize-legacy-block-udis-20260813");
    }
}

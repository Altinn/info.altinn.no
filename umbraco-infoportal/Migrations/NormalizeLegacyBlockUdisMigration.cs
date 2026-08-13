using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Infrastructure.Migrations;

namespace umbraco_infoportal.Migrations;

/// <summary>
/// Repairs block editor values that Umbraco 18 can no longer read because they are still stored in
/// the pre-Umbraco-15 "Udi" shape.
/// </summary>
/// <remarks>
/// <para>
/// Umbraco 15 shipped <c>ConvertBlockListEditorProperties</c> and <c>ConvertBlockGridEditorProperties</c>
/// to convert these values, and Umbraco 18 removed both those migrations and the read-time shim that
/// made them optional. Content imported into this installation after the version 15 upgrade had already
/// run was therefore never converted, and on 18 it reads as an empty "Unsupported" block.
/// See <see cref="LegacyBlockUdiNormalizer"/> for the exact mechanics.
/// </para>
/// <para>
/// Block editors declare <c>ValueTypes.Json</c>, which maps to <c>ValueStorageType.Ntext</c>, so their
/// values always live in the <c>textValue</c> column.
/// </para>
/// </remarks>
public class NormalizeLegacyBlockUdisMigration : AsyncMigrationBase
{
    private const string PropertyDataTable = Constants.DatabaseSchema.Tables.PropertyData;

    public NormalizeLegacyBlockUdisMigration(IMigrationContext context)
        : base(context)
    {
    }

    protected override Task MigrateAsync()
    {
        EnsureLongCommandTimeout(Database);

        List<LegacyBlockPropertyData> candidates = Database.Fetch<LegacyBlockPropertyData>(
            $"SELECT id AS Id, textValue AS TextValue FROM {PropertyDataTable} "
                + "WHERE textValue LIKE @0 OR textValue LIKE @1",
            "%contentUdi%",
            "%settingsUdi%");

        if (candidates.Count == 0)
        {
            Logger.LogInformation("Found no block values in the legacy Udi shape, nothing to repair.");
            return Task.CompletedTask;
        }

        int repaired = 0;

        foreach (LegacyBlockPropertyData candidate in candidates)
        {
            if (!LegacyBlockUdiNormalizer.TryNormalize(candidate.TextValue, out string? normalizedValue))
            {
                continue;
            }

            Database.Execute(
                $"UPDATE {PropertyDataTable} SET textValue = @0 WHERE id = @1",
                normalizedValue,
                candidate.Id);

            repaired++;
        }

        Logger.LogInformation(
            "Repaired {RepairedCount} of {CandidateCount} property values stored in the legacy block Udi shape.",
            repaired,
            candidates.Count);

        if (repaired < candidates.Count)
        {
            Logger.LogWarning(
                "Left {SkippedCount} property values untouched: they already carry block keys, or their "
                    + "value could not be parsed as JSON.",
                candidates.Count - repaired);
        }

        // The published cache holds its own copy of these values, so it has to be rebuilt for the front
        // end to pick up the repair. The plan executor reads this flag after the migration has run, so
        // setting it here keeps environments that had nothing to repair from paying for a rebuild.
        RebuildCache = repaired > 0;

        return Task.CompletedTask;
    }

    private sealed class LegacyBlockPropertyData
    {
        public int Id { get; set; }

        public string? TextValue { get; set; }
    }
}

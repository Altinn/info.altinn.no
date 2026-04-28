import type { IJSONTransformer } from "./IJSONTransformer";

export class RelevantSchemasBlockTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const p = cmsPageData.properties ?? {};

    const rawSchemas: any[] = Array.isArray(p.schemas) ? p.schemas : [];

    const schemas = rawSchemas.map((schema: any) => {
      // Umbraco content items use route.path; production data uses url directly
      const url = schema.route?.path ?? schema.url ?? "";
      const pageName = schema.pageName ?? schema.name ?? "";

      const providerIcons = Array.isArray(schema.providerIcons)
        ? schema.providerIcons.map((icon: any) => {
            const iconProps = icon.properties ?? icon;
            return {
              name: iconProps.name ?? "",
              imageUrl: iconProps.imageUrl ?? null,
              url: iconProps.url ?? iconProps.route?.path ?? "",
            };
          })
        : [];

      return { pageName, url, providerIcons, andMoreText: schema.andMoreText ?? "" };
    });

    return {
      componentName: "RelevantSchemasBlock",
      relevantSchemasHeader: p.relevantSchemasHeader ?? undefined,
      schemas,
      showAllSchemasText: p.showAllSchemasText ?? undefined,
      schemaOverviewPageUrl: p.schemaOverviewPageUrl ?? "/skjemaoversikt/",
    };
  }
}

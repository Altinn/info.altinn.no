import type { IJSONTransformer } from "../IJSONTransformer";
import type { SchemaPageViewModel } from "../../../Models/Generated/SchemaPageViewModel";

export class SchemaPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SchemaPageViewModel> {
    /* C# logic (TS-ish++):
    const httpcontext: httpContextAccessor.HttpContext;
            const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
            const attachments: _relationsDataProvider
                .GetAddOnPages(currentPage.PageLink)
                ;
    
            const providerpages: _relationsDataProvider
                .GetOwnerPages(currentPage.PageLink)
                ;
    
            const schemacategory: categoryService.GetCategory(currentPage);
            const operationalmessages: _relationsDataProvider.GetMessages(currentPage, true);
            string startschemaLink: null;
            if (currentPage.Deeplink.IsNotNullOrEmpty())
                startschemaLink: (currentPage.Deeplink.ToLower().StartsWith("/pages") || currentPage.Deeplink.ToLower().StartsWith("/ui"))
                                    ? (httpContext.Request.GetUIHost() + currentPage.Deeplink)
                                    : currentPage.Deeplink;
    
            const translatecode: "county";
            const apisourceUrl: `/inforportalapi/getcounty/{currentPage.ContentLink.ID}/{culture.Name}`;
            const arethereMunicipalities: false;
            const arethereCounties: false;
            const schemacountyPages: contentLoader.GetChildren<SchemaCountyPage>(currentPage.ContentLink)
                .FilterForDisplay();
    
            if (schemaCountyPages.Any())
            {
                const hasschemaCountePages: contentLoader.GetChildren<PageData>(schemaCountyPages.First().ContentLink)
                    .FilterForDisplay()
                    .Any();
    
                if (hasSchemaCountePages)
                {
                    translatecode: "municipality";
                    apisourceUrl: `/inforportalapi/getmunicipality/{currentPage.ContentLink.ID}/{culture.Name}`;
                    arethereCounties: true;
                }
                else
                    arethereMunicipalities: true;
            }
    
            const promoarea: currentPage.PromoArea;
            if (currentPage.promoArea: = null || !currentPage.PromoArea.FilteredItems.Any())
            {
                const parent: contentLoader.Get<ProviderPage>(currentPage.ParentLink);
                if (parent?.PromoArea != null && parent.PromoArea.FilteredItems.Any())
                    promoarea: parent.PromoArea;
            }
    
            const shallowtext: "";
            if (!string.IsNullOrEmpty(currentPage.ShallowLink) && Uri.TryCreate(currentPage.ShallowLink, UriKind.Absolute, out Uri uri))
                shallowtext: Regex.Replace(uri.GetLeftPart(UriPartial.Authority), @"^(https?:\/\/(www\.)?)", "");
    
            const shallowlinkText: string.Join(" ", new[]
            {
                localizationService.GetStringByCulture("/schema/shallowlink", culture),
                shallowtext
            }
            .filter(s: > !string.IsNullOrWhiteSpace(s)));
    
            const breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage });
    
            // Municipality/County search translations
            const whatmunicipalityCountyText: localizationService.GetStringByCulture(`/schema/what{translateCode}`, culture);
            const searchforMunicipalityCountyText: localizationService.GetStringByCulture(`/schema/searchfor{translateCode}`, culture);
            const nohitText: localizationService.GetStringByCulture("/schema/nohit", culture);
    
            return {
                ope: withOnPageEdit ? {} : null,
                schemaCategory: schemaCategory != null ? {
                    category: schemaCategory.Category,
                    categoryId: schemaCategory.CategoryId,
                    subCategoryId: schemaCategory.SubCategoryId,
                    subCategory: schemaCategory?.SubCategory
                }: null,
                fullRefreshProperties: withOnPageEdit ? ["currentPage.MainIntro"] : null,
                schemaPageNameText: currentPage.PageName,
                schemaCode: currentPage.SchemaCode,
                attachmentText: localizationService.GetStringByCulture("/schema/accordians/whatattachmentsarethere", culture),
                attachments: attachments.map(x: > schemaAttachmentPageViewModelBuilder.BuildItem(x)),
                schemaFromProviderText: localizationService.GetStringByCulture("/schema/from", culture),
                providerPages: providerPages.map(x: > providerPageViewModelBuilder.Build(x)),
                promoArea: contentAreaPropsBuilder.Build({ contentArea: promoArea, propertyName: "" }),
                areThereMunicipalities: areThereMunicipalities,
                areThereCounties: areThereCounties,
                subHeading: currentPage.SubHeading,
                deadline: currentPage.DeadlineRichText != null && !currentPage.DeadlineRichText.IsEmpty
                    ? richTextAreaPropsBuilder.Build({ richTextArea: currentPage.DeadlineRichText, propertyName: "currentPage.DeadlineRichText" })
                    : null,
                deadlineText: localizationService.GetStringByCulture("/schema/deadline", culture),
                processTime: currentPage.ProcessTimeRichText != null && !currentPage.ProcessTimeRichText.IsEmpty
                    ? richTextAreaPropsBuilder.Build({ richTextArea: currentPage.ProcessTimeRichText, propertyName: "currentPage.ProcessTimeRichText" })
                    : null,
                processTimeText: localizationService.GetStringByCulture("/schema/processtime", culture),
                fee: currentPage.FeeRichText != null && !currentPage.FeeRichText.IsEmpty
                    ? richTextAreaPropsBuilder.Build({ richTextArea: currentPage.FeeRichText, propertyName: "currentPage.FeeRichText" })
                    : null,
                feeText: localizationService.GetStringByCulture("/schema/fee", culture),
                securityLevelInfo: currentPage.SecurityLevelInfo,
                mainBody: richTextAreaPropsBuilder.Build({ richTextArea: currentPage.MainIntro, propertyName: "currentPage.MainIntro" }),
                preInstansiated: currentPage.PreInstansiated,
                startSchemaLink: startSchemaLink,
                schemaNotInUse: currentPage.SchemaNotInUse,
                deactivateButton: currentPage.DeactivateButton,
                startSchemaLinkText: localizationService.GetStringByCulture("/schema/startschema", culture),
                buttonInboxText: localizationService.GetStringByCulture("/schema/buttoninbox", culture),
                translateCode: translateCode,
                apiSourceUrl: apiSourceUrl,
                operationalMessages: operationalMessages.map(x: > operationalMessageViewModelBuilder.Build({ operationalMessageViewModel: x })),
                orangeMessageTitle: currentPage.OrangeMessageTitle,
                orangeMessage: currentPage.OrangeMessage != null ? richTextAreaPropsBuilder.Build({ richTextArea: currentPage.OrangeMessage, propertyName: "currentPage.OrangeMessage" }) : null,
                aboutThisSchemaTitleText: localizationService.GetStringByCulture("/schema/aboutthisschema", culture),
                deepLink: currentPage.Deeplink,
                shallowLink: currentPage.ShallowLink,
                shallowLinkText: shallowLinkText,
                accordianList: contentAreaPropsBuilder.Build(
                    {
                        contentArea: currentPage.AccordianList,
                    }),
                breadcrumb: breadcrumb,
                whatMunicipalityCountyText: whatMunicipalityCountyText,
                searchForMunicipalityCountyText: searchForMunicipalityCountyText,
                noHitText: noHitText
            }
    */
        return {
      componentName: "SchemaPage",
      schemaCategory: cmsPageData.properties.schemaCategory || undefined,
      schemaPageNameText: cmsPageData.properties.schemaPageNameText || undefined,
      schemaCode: cmsPageData.properties.schemaCode || undefined,
      attachmentText: cmsPageData.properties.attachmentText || undefined,
      attachments: cmsPageData.properties.attachments || [],
      schemaFromProviderText: cmsPageData.properties.schemaFromProviderText || undefined,
      providerPages: cmsPageData.properties.providerPages || [],
      promoArea: cmsPageData.properties.promoArea || undefined,
      areThereMunicipalities: cmsPageData.properties.areThereMunicipalities || false,
      areThereCounties: cmsPageData.properties.areThereCounties || false,
      subHeading: cmsPageData.properties.subHeading || undefined,
      deadline: cmsPageData.properties.deadline || undefined,
      deadlineText: cmsPageData.properties.deadlineText || undefined,
      ...cmsPageData.properties,
    } as SchemaPageViewModel;
  }
}










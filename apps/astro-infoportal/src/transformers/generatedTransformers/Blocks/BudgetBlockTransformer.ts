import type { IJSONTransformer } from "../IJSONTransformer";

export class BudgetBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const viewmodel: {
                        sumDescriptionText: block.SumDescriptionText,
                        sumValueText: block.SumValueText,
                        budgetDetails: block.BudgetDetails?
                            .map(bd: > {
                                heading: bd.Heading,
                                value: bd.Value
                            })
                             ?? new System.Collections.Generic.Array<BudgetLineViewModel>(),
                        ope: withOnPageEdit ? {} : null
                    };
        
                    return viewModel
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "BudgetBlock",
            sumDescriptionText: props?.sumDescriptionText ?? null,
            sumValueText: props?.sumValueText ?? null,
            budgetDetails: props?.budgetDetails ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}








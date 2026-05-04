import type { IJSONTransformer } from "../IJSONTransformer";

export class ModalButtonBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const modalviewModel: {
                        title: block.ModalTitle,
                        html: block.ModalBody != null
                                       ? richTextAreaPropsBuilder.Build(
                                           {
                                               richTextArea: block.ModalBody,
                                               propertyName: "block.ModalBody"
                                           },
                                           withOnPageEdit)
                                       : null
                    };
        
        
                    if (!ContentReference.IsNullOrEmpty(block.ModalContent)
                        && contentLoader.TryGet(block.ModalContent, out SchemaPage schemaPage))
                    {
                        const schemapageViewModel: schemaPageViewModelBuilder.Build(schemaPage, withOnPageEdit);
                        schemaPageViewModel.breadcrumb: null;
                        modalViewModel.schemaPage: schemaPageViewModel;
                    }
        
                    return {
                        name: block.Name,
                        modal: modalViewModel
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ModalButtonBlock",
            name: props?.name ?? null,
            modal: props?.modal ?? null,
        };

        return bodyData;
    }
}








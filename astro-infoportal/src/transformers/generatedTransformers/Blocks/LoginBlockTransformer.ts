import type { IJSONTransformer } from "../IJSONTransformer";

export class LoginBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        title: currentBlock.Title,
                        ingress: currentBlock.Ingress,
                        loginButtonSuffix: currentBlock.LoginButtonSuffix,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "LoginBlock",
            title: props?.title ?? null,
            ingress: props?.ingress ?? null,
            loginButtonSuffix: props?.loginButtonSuffix ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}








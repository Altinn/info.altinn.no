export interface IJSONTransformer {
  Transform(cmsPageData: any, globalData?: any): Promise<any>;
}

import type { IJSONTransformer } from "../IJSONTransformer";

export class TableBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const viewmodel: {
                        columnHeader1: block.ColumnHeader1,
                        columnHeader2: block.ColumnHeader2,
                        columnHeader3: block.ColumnHeader3,
                        columnHeader4: block.ColumnHeader4,
                        columnHeader5: block.ColumnHeader5,
                        columnHeader6: block.ColumnHeader6,
                        ope: withOnPageEdit ? {} : null
                    };
        
                    // Get all available headers from the block
                    const availableheaders: {
                        block.ColumnHeader1,
                        block.ColumnHeader2,
                        block.ColumnHeader3,
                        block.ColumnHeader4,
                        block.ColumnHeader5,
                        block.ColumnHeader6
                    };
        
                    // Build rows
                    if (block.Rows != null)
                    {
                        for (const r of block.Rows)
                        {
                            const row: {
                                // 1:1 row fields
                                column1: r.Column1,
                                column2: r.Column2,
                                column3: r.Column3,
                                column4: r.Column4,
                                column5: r.Column5,
                                column6: r.Column6,
                            };
        
                            viewModel.Rows.push(row);
                        }
                    }
        
                    return viewModel
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "TableBlock",
            columnHeader1: props?.columnHeader1 ?? null,
            columnHeader2: props?.columnHeader2 ?? null,
            columnHeader3: props?.columnHeader3 ?? null,
            columnHeader4: props?.columnHeader4 ?? null,
            columnHeader5: props?.columnHeader5 ?? null,
            columnHeader6: props?.columnHeader6 ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}








import "./TableBlock.scss";

const TableBlock = ({
  columnHeader1,
  columnHeader2,
  columnHeader3,
  columnHeader4,
  columnHeader5,
  columnHeader6,
  rows,
}: any) => {
  // Build array of column headers, filtering out empty ones
  const columnHeaders = [
    columnHeader1,
    columnHeader2,
    columnHeader3,
    columnHeader4,
    columnHeader5,
    columnHeader6,
  ].filter((header: any) => header && header.trim() !== "");

  return (
    <div className="legacy-page a-responsiveTable-container my-5">
      <table className="a-responsiveTable">
        <thead>
          <tr>
            {columnHeaders.map((header: any, index: number) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((row: any, rowIndex: number) => {
            // Build array of column values in the same order as headers
            const columnValues = [
              row.column1,
              row.column2,
              row.column3,
              row.column4,
              row.column5,
              row.column6,
            ].slice(0, columnHeaders.length);

            return (
              <tr key={rowIndex}>
                {columnValues.map((value: any, colIndex: number) => {
                  // First column is rendered as <th scope="row">
                  if (colIndex === 0) {
                    return (
                      <th key={colIndex} scope="row">
                        {value}
                      </th>
                    );
                  }
                  // Other columns are <td> with data-title attribute
                  return (
                    <td key={colIndex} data-title={columnHeaders[colIndex]}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TableBlock;

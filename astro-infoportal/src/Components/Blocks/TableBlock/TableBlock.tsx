import type { TableBlockViewModel } from "/Models/Generated/TableBlockViewModel";
import "./TableBlock.scss";

const TableBlock = ({
  columnHeader1,
  columnHeader2,
  columnHeader3,
  columnHeader4,
  columnHeader5,
  columnHeader6,
  rows,
}: TableBlockViewModel) => {
  // Build array of column headers, filtering out empty ones
  const columnHeaders = [
    columnHeader1,
    columnHeader2,
    columnHeader3,
    columnHeader4,
    columnHeader5,
    columnHeader6,
  ].filter((header) => header && header.trim() !== "");

  return (
    <div className="legacy-page a-responsiveTable-container my-5">
      <table className="a-responsiveTable">
        <thead>
          <tr>
            {columnHeaders.map((header, index) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((row, rowIndex) => {
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
                {columnValues.map((value, colIndex) => {
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

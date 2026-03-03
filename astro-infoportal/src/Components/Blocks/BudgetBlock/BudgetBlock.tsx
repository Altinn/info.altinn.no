import type { BudgetBlockViewModel } from "/Models/Generated/BudgetBlockViewModel";
import "../../../styles/legacy-pages.scss";
import "./BudgetBlock.scss";

const BudgetBlock = ({
  budgetDetails,
  sumDescriptionText,
  sumValueText,
}: BudgetBlockViewModel) => {
  if (!budgetDetails || budgetDetails.length === 0) {
    return null;
  }

  return (
    <div className="legacy-page">
      <div className="table-responsive">
        <table className="table a-table a-table-calculation">
          <tbody>
            {budgetDetails.map((budgetDetail, index) => (
              <tr key={index}>
                <th scope="row">{budgetDetail.heading || ""}</th>
                <td>{budgetDetail.value || ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{sumDescriptionText || ""}</th>
              <td>{sumValueText || ""}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BudgetBlock;

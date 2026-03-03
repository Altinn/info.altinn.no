import { ContentArea } from "/App.Components";
import type { AccordianCollectionBlockViewModel } from "/Models/Generated/AccordianCollectionBlockViewModel";

const AccordianCollectionBlock = ({
    accordianArea,
}: AccordianCollectionBlockViewModel) => {
    return <>
        {accordianArea && <ContentArea {...accordianArea} />}
    </>;
};
export default AccordianCollectionBlock;

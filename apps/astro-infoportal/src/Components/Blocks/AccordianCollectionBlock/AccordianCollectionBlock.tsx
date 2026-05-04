import { ContentArea } from "/App.Components";

const AccordianCollectionBlock = ({
    accordianArea,
}: any) => {
    return <>
        {accordianArea && <ContentArea {...accordianArea} />}
    </>;
};
export default AccordianCollectionBlock;

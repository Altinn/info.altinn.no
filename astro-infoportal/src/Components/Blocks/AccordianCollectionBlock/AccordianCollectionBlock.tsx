import { ContentArea } from "/App.Components";

// Umbraco's RichTextPropertyConverter delivers `accordianArea` as a raw array of
// pre-rendered block items, whereas Optimizely supplied a {componentName, items}
// shape. Accept both and normalise so ContentArea sees its expected `items` prop.
const AccordianCollectionBlock = ({ accordianArea }: any) => {
    const data = Array.isArray(accordianArea)
        ? { items: accordianArea }
        : accordianArea;
    return data ? <ContentArea {...data} /> : null;
};
export default AccordianCollectionBlock;

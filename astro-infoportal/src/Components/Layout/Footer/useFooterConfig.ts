import type { FooterProps } from "@altinn/altinn-components";

const useFooterConfig = ({
  address1,
  address2,
  aboutAltinnReference,
  helpPage,
  privacyReference,
  accessibilityLocation,
  operationalMessagesReference
}: any): FooterProps => {
  const menuItems = [
    helpPage && { id: "1", title: helpPage.text || "", href: helpPage.url || "" },
    aboutAltinnReference && { id: "2", title: aboutAltinnReference.text || "", href: aboutAltinnReference.url || "" },
    operationalMessagesReference && { id: "3", title: operationalMessagesReference.text || "", href: operationalMessagesReference.url || "" },
    privacyReference && { id: "4", title: privacyReference.text || "", href: privacyReference.url || "" },
    accessibilityLocation && { id: "5", title: accessibilityLocation.text || "", href: accessibilityLocation.url || "" },
  ].filter((item): item is NonNullable<typeof item> => item != null);

  const footerProps: FooterProps = {
    address: address1 || "",
    address2: address2 || "",
    menu: {
      items: menuItems,
    },
  };

  return footerProps;
};

export default useFooterConfig;
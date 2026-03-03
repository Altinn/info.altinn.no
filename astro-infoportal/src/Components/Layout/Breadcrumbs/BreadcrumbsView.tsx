import { BreadcrumbViewModel } from "/Models/Generated/BreadcrumbViewModel";
import "@altinn/altinn-components/dist/global.css";
import { Breadcrumbs } from "@digdir/designsystemet-react";
import "./BreadcrumbsView.scss";

const BreadcrumbsView = ({ breadcrumbs }: BreadcrumbViewModel) => {
  const breadcrumbNavList = breadcrumbs
    .filter((x): x is typeof x & { linkItem: NonNullable<typeof x.linkItem> } =>
      x.linkItem != null
    )
    .map((x) => ({
      label: x.linkItem.text || "",
      href: x.linkItem.url || "",
    }));

  return (
    <Breadcrumbs
      className="breadcrumbs-view"
      data-color="neutral"
      data-size="sm"
      aria-label="Du er her:"
    >
      <Breadcrumbs.List>
        {breadcrumbNavList.map((bc, index) => (
          <Breadcrumbs.Item key={index}>
            <Breadcrumbs.Link href={bc.href}>{bc.label}</Breadcrumbs.Link>
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs.List>
    </Breadcrumbs>
  );
};

export default BreadcrumbsView;

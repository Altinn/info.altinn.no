import "@altinn/altinn-components/dist/global.css";
import { Breadcrumbs } from "@digdir/designsystemet-react";
import "./BreadcrumbsView.scss";

const BreadcrumbsView = ({ breadcrumbs }: any) => {
  const breadcrumbNavList = breadcrumbs
    .filter((x: any): x is typeof x & { linkItem: NonNullable<typeof x.linkItem> } =>
      x.linkItem != null
    )
    .map((x: any) => ({
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
        {breadcrumbNavList.map((bc: any, index: number) => (
          <Breadcrumbs.Item key={index}>
            <Breadcrumbs.Link href={bc.href}>{bc.label}</Breadcrumbs.Link>
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs.List>
    </Breadcrumbs>
  );
};

export default BreadcrumbsView;

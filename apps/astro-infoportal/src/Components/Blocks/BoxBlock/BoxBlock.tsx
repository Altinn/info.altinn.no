import { Modal } from "@altinn/altinn-components";
import { Card, Paragraph } from "@digdir/designsystemet-react";
import * as AkselIcons from "@navikt/aksel-icons";
import { useState } from "react";
import { RichTextArea } from "/App.Components";
import { BoxTypes, BoxColors } from "../../../Constants/ComponentVariants";

import "./BoxBlock.scss";

const BoxBlock = ({
  link,
  description,
  color = BoxColors.Blue,
  type = BoxTypes.Link,
  title,
  modal,
}: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isModalType = type === BoxTypes.Modal;
  const colorClass = color === BoxColors.Beige ? "box-block--beige" : "box-block--blue";

  // Title is required for both modes
  if (!title) return null;

  // For link mode, also require link URL
  if (!isModalType && !link?.url) return null;

  const isExternal = link?.url ? /^https?:\/\//i.test(link.url) : false;

  if (isModalType) {
    return (
      <>
        <Card asChild data-color="neutral">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`box-block box-block--button ${colorClass}`}
            aria-haspopup="dialog"
            aria-expanded={isModalOpen}
          >
            <h3 className="box-block__title">
              <span className="box-block__title-text">{title}</span>
              <AkselIcons.ArrowRightIcon aria-hidden className="box-block__icon" />
            </h3>
            {description && (
              <Paragraph className="box-block__description">{description}</Paragraph>
            )}
          </button>
        </Card>
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          dismissable
          closeTitle="Close"
          closedBy="any"
          backdropColor="inherit"
          variant="content"
        >
          {modal?.title && (
            <h2 className="modal-title" style={{ margin: 0 }}>
              {modal.title}
            </h2>
          )}
          {modal?.body && <RichTextArea {...modal.body} />}
        </Modal>
      </>
    );
  }

  return (
    <Card asChild data-color="neutral">
      <a
        href={link?.url || ""}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={`box-block ${colorClass}`}
      >
        <h3 className="box-block__title">
          <span className="box-block__title-text">{title}</span>
          <AkselIcons.ArrowRightIcon aria-hidden className="box-block__icon" />
        </h3>
        {description && (
          <Paragraph className="box-block__description">{description}</Paragraph>
        )}
      </a>
    </Card>
  );
};

// Export as both LinkBox and ModalBox for SSR component mapping
export const LinkBox = BoxBlock;
export const ModalBox = BoxBlock;
export default BoxBlock;

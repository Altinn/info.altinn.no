import { DsButton, Modal} from "@altinn/altinn-components";
import { ArrowRightIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import { RichTextArea, SchemaPage } from "/App.Components";
import type { ModalButtonBlockViewModel } from "/Models/Generated/ModalButtonBlockViewModel";
import ProvidersInline, {
  ProviderInlineItem,
} from "../../Shared/ProvidersInline/ProvidersInline";
import "./ModalButtonBlock.scss";

const ModalButtonBlock = ({ name, modal }: ModalButtonBlockViewModel) => {
	const [open, setOpen] = useState(false);
	const providerPages = modal?.schemaPage?.providerPages ?? [];
	const providersInline: ProviderInlineItem[] = providerPages.map(
		({ pageName, providerIcon, url, showAllSchemesLinKText }: any) => ({
			name: pageName,
			imageUrl: providerIcon?.imageUrl || "",
			url,
			title: showAllSchemesLinKText || pageName,
		})
	);
	const modalTitle = modal?.schemaPage?.schemaPageNameText ? "" : modal?.title;
	return (
		<div className={`button-block`}>
			<DsButton
				onClick={() => setOpen(true)}
				className="btn-modal"
				aria-haspopup="dialog"
				aria-expanded={open}
			>
				<span className="btn-modal__inner">
					<span className="btn-modal__title">
						{name}
						<ArrowRightIcon
							aria-hidden
							className="btn-modal__icon"
							fontSize="1.5rem"
						/>
					</span>
					{providersInline.length > 0 && (
						<ProvidersInline
							providers={providersInline}
							strong={false}
							textColor="white"
						/>
					)}
				</span>
			</DsButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        dismissable
        closeTitle="Close"
        closedBy="any"
        backdropColor="inherit"
        variant="content"
      >
        {modalTitle && (
          <h2 className="modal-title" style={{ margin: 0 }}>
            {modalTitle}
          </h2>
        )}
        {modal?.schemaPage && <SchemaPage {...modal.schemaPage} />}
        {modal?.html && <RichTextArea {...modal.html} />}
      </Modal>
    </div>
  );
};

export default ModalButtonBlock;

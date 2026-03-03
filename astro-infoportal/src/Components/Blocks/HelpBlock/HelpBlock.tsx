import { HelpBlockViewModel } from "/Models/Generated/HelpBlockViewModel";
import "./HelpBlock.scss";
import { RichTextArea } from "/App.Components";

const HelpBlock = ({ description }: HelpBlockViewModel) => {

  return (
    <div>
      {description && <RichTextArea {...description} />}
    </div>
    //   <a
    //     href="javascript:void(0)"
    //     tabIndex={0}
    //     className="a-linkArea a-helpIconButton a-helpIconButton--blue a-js-togglePopoverIcons a-js-blurrablePopover"
    //     role="button"
    //     data-toggle="popover"
    //     data-template="<div class='popover footnote' role='tooltip'><div class='popover-arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div></div>"
    //     data-placement="bottom"
    //     data-trigger="focus"
    //     data-content={descriptionHtml}
    //     data-html="true"
    //   >
    //     <i className="tmp tmp-plus" aria-hidden="true" style={{ display: "inline-block" }} />
    //     <i className="tmp tmp-minus" aria-hidden="true" style={{ display: "none" }} />
    //   </a>
    // );
  );
}

export default HelpBlock;

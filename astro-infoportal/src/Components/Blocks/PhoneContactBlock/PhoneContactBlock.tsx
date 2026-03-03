import { Typography } from "@altinn/altinn-components";
import type { PhoneContactBlockViewModel } from "/Models/Generated/PhoneContactBlockViewModel";

const PhoneContactBlock = ({
  header,
  text,
  phoneNumber,
}: PhoneContactBlockViewModel) => {
  return (
    <div className="contact-block contact-block--phone">
      {header && <Typography as="h3">{header}</Typography>}
      {text && <Typography as="p">{text}</Typography>}
      {phoneNumber && (
        <Typography as="p">
          <a href={`tel:${phoneNumber.replace(/\s/g, "")}`}>{phoneNumber}</a>
        </Typography>
      )}
    </div>
  );
};

export default PhoneContactBlock;

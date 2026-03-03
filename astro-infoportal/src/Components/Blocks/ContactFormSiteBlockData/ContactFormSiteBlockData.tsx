import { ContactFormSiteBlockDataViewModel } from "/Models/Generated/ContactFormSiteBlockDataViewModel"

const ContactFormSiteBlockData = ({
    heading
}: ContactFormSiteBlockDataViewModel) => {

    return (
        <div>
            <h3>
                {heading}
            </h3>
        </div>
    );
};

export default ContactFormSiteBlockData;
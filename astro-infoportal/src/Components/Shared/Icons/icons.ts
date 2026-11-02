import { createSpriteIcon } from "./SpriteIcon";

// Icons served from the shared sprite. Each createSpriteIcon("Name") call here
// adds @navikt/aksel-icons' NameIcon to the sprite at build time (see
// plugins/iconSprite.mjs), so import icons from this module rather than from
// aksel when they are rendered on more than one page or more than once. Icons
// editors commonly pick by name in the CMS belong here too: resolveIcon serves
// any other aksel icon from the much larger full sprite.
export const ArrowDownRightIcon = createSpriteIcon("ArrowDownRight");
export const ArrowRightIcon = createSpriteIcon("ArrowRight");
export const BankNoteIcon = createSpriteIcon("BankNote");
export const BellDotIcon = createSpriteIcon("BellDot");
export const BriefcaseIcon = createSpriteIcon("Briefcase");
export const Buildings2Icon = createSpriteIcon("Buildings2");
export const Buildings3Icon = createSpriteIcon("Buildings3");
export const ChatExclamationmarkIcon = createSpriteIcon("ChatExclamationmark");
export const ChevronRightIcon = createSpriteIcon("ChevronRight");
export const ClockDashedIcon = createSpriteIcon("ClockDashed");
export const DownloadIcon = createSpriteIcon("Download");
export const EnterIcon = createSpriteIcon("Enter");
export const EnvelopeOpenIcon = createSpriteIcon("EnvelopeOpen");
export const FlowerPensionIcon = createSpriteIcon("FlowerPension");
export const GlobeIcon = createSpriteIcon("Globe");
export const HeadHeartIcon = createSpriteIcon("HeadHeart");
export const HourglassIcon = createSpriteIcon("Hourglass");
export const HouseHeartIcon = createSpriteIcon("HouseHeart");
export const InboxFillIcon = createSpriteIcon("InboxFill");
export const InboxIcon = createSpriteIcon("Inbox");
export const InformationSquareIcon = createSpriteIcon("InformationSquare");
export const LinkIcon = createSpriteIcon("Link");
export const MagnifyingGlassIcon = createSpriteIcon("MagnifyingGlass");
export const MenuGridIcon = createSpriteIcon("MenuGrid");
export const MobileIcon = createSpriteIcon("Mobile");
export const PadlockLockedFillIcon = createSpriteIcon("PadlockLockedFill");
export const PadlockLockedIcon = createSpriteIcon("PadlockLocked");
export const PaperplaneIcon = createSpriteIcon("Paperplane");
export const PassportIcon = createSpriteIcon("Passport");
export const PencilWritingIcon = createSpriteIcon("PencilWriting");
export const PersonCircleIcon = createSpriteIcon("PersonCircle");
export const PersonGroupIcon = createSpriteIcon("PersonGroup");
export const PersonIcon = createSpriteIcon("Person");
export const PhoneIcon = createSpriteIcon("Phone");
export const ReceptionIcon = createSpriteIcon("Reception");
export const SackKronerIcon = createSpriteIcon("SackKroner");
export const SealCheckmarkIcon = createSpriteIcon("SealCheckmark");
export const TrendUpIcon = createSpriteIcon("TrendUp");
export const UploadIcon = createSpriteIcon("Upload");
export const XMarkIcon = createSpriteIcon("XMark");

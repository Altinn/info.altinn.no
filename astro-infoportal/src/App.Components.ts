import { type ComponentProps, createElement } from "react";
import { withIsland } from "./Components/Shared/Island/Island";
import AccordianCollectionBlock from "./Components/Blocks/AccordianCollectionBlock/AccordianCollectionBlock";
import AccordianThemeBlockRaw from "./Components/Blocks/AccordianThemeBlock/AccordianThemeBlock";
import AccordionBlock from "./Components/Blocks/AccordionBlock/AccordionBlock";
import AlternativeLoginBlock from "./Components/Blocks/AlternativeLoginBlock/AlternativeLoginBlock";
import BudgetBlock from "./Components/Blocks/BudgetBlock/BudgetBlock";
import CampaignBlock from "./Components/Blocks/CampaignBlock/CampaignBlock";
import CompareBlock from "./Components/Blocks/CompareBlock/CompareBlock";
import ContactFormBlockRaw from "./Components/Blocks/ContactFormBlock/ContactFormBlock";
import ContactFormTextBlock from "./Components/Blocks/ContactFormTextBlock/ContactFormTextBlock";
import ContactFormSiteBlockData from "./Components/Blocks/ContactFormSiteBlockData/ContactFormSiteBlockData";
import ContactListBlockRaw from "./Components/Blocks/ContactListBlock/ContactListBlock";
import ContentBlock from "./Components/Blocks/ContentBlock/ContentBlock";
import DoYouNeedHelpBlockRaw from "./Components/Blocks/DoYouNeedHelpBlock/DoYouNeedHelpBlock";
import EGuideStartBlock from "./Components/Blocks/EGuideStartBlock/EGuideStartBlock";
import HelpBlock from "./Components/Blocks/HelpBlock/HelpBlock";
import HelpContactBlock from "./Components/Blocks/HelpContactBlock/HelpContactBlock";
import HelpPhoneBlock from "./Components/Blocks/HelpPhoneBlock/HelpPhoneBlock";
import AdvisorStartBlock from "./Components/Blocks/AdvisorStartBlock/AdvisorStartBlock";
import LinkButtonBlock from "./Components/Blocks/LinkButtonBlock/LinkButtonBlock";
import BoxBlockRaw from "./Components/Blocks/BoxBlock/BoxBlock";
import LinkBlock from "./Components/Blocks/LinkBlock/LinkBlock";
import LinkListBlock from "./Components/Blocks/LinkListBlock/LinkListBlock";
import LoginBlock from "./Components/Blocks/LoginBlock/LoginBlock";
import ModalButtonBlockRaw from "./Components/Blocks/ModalButtonBlock/ModalButtonBlock";
import PhoneContactBlock from "./Components/Blocks/PhoneContactBlock/PhoneContactBlock";
import PlainLinkBlock from "./Components/Blocks/PlainLinkBlock/PlainLinkBlock";
import ProviderContactInformationBlockRaw from "./Components/Blocks/ProviderContactInformationBlock/ProviderContactInformationBlock";
import QuoteBlock from "./Components/Blocks/QuoteBlock/QuoteBlock";
import QuoteWithImageBlock from "./Components/Blocks/QuoteWithImageBlock/QuoteWithImageBlock";
import RelevantSchemasBlock from "./Components/Blocks/RelevantSchemasBlock/RelevantSchemasBlock";
import RichTextBlock from "./Components/Blocks/RichTextBlock/RichTextBlock";
import SchemaAccordianBlock from "./Components/Blocks/SchemaAccordianBlock/SchemaAccordianBlock";
import SocialNetworkContactBlock from "./Components/Blocks/SocialNetworkContactBlock/SocialNetworkContactBlock";
import SubscriptionBlock from "./Components/Blocks/SubscriptionBlock/SubscriptionBlock";
import TableBlock from "./Components/Blocks/TableBlock/TableBlock";
import ThirdPartySubscriptionBlock from "./Components/Blocks/ThirdPartySubscriptionBlock/ThirdPartySubscriptionBlock";
import TimelineBlock from "./Components/Blocks/TimelineBlock/TimelineBlock";
import UrlBlock from "./Components/Blocks/UrlBlock/UrlBlock";
import VectorImageBlock from "./Components/Blocks/VectorImageBlock/VectorImageBlock";
import VideoBlock from "./Components/Blocks/VideoBlock/VideoBlock";
import VectorImageFile from "./Components/Media/VectorImageFile/VectorImageFile";
import ImageFile from "./Components/Media/ImageFile/ImageFile";
import VideoFile from "./Components/Media/VideoFile/VideoFile";
import GenericMedia from "./Components/Media/GenericMedia/GenericMedia";
import LatestNewsBlock from "./Components/Blocks/LatestNewsBlock/LatestNewsBlock";
import LatestNewsBlockV2 from "./Components/Blocks/LatestNewsBlockV2/LatestNewsBlockV2";
import ContactFormModalRaw from "./Components/ContactFormModal/ContactFormModal";
import ContactFormPageTriggerRaw from "./Components/ContactFormPageTrigger/ContactFormPageTrigger";
import SiteLayout from "./Components/Layout/SiteLayout/SiteLayout";
import AboutPage from "./Components/Pages/AboutPage/AboutPage";
import CategoryPage from "./Components/Pages/CategoryPage/CategoryPage";
import HelpDrilldownPage from "./Components/Pages/HelpDrilldownPage/HelpDrilldownPage";
import HelpLandingPage from "./Components/Pages/HelpLandingPage/HelpLandingPage";
import HelpPage from "./Components/Pages/HelpPage/HelpPage";
import HelpProcessArticlePage from "./Components/Pages/HelpProcessArticlePage/HelpProcessArticlePage";
import HelpQuestionPage from "./Components/Pages/HelpQuestionPage/HelpQuestionPage";
import HelpSearchPageRaw from "./Components/Pages/HelpSearchPage/HelpSearchPage";
import HelpStartPage from "./Components/Pages/HelpStartPage/HelpStartPage";
import HeroArticlePageBase from "./Components/Pages/HeroArticlePageBase/HeroArticlePageBase";
import NewsArchivePageRaw from "./Components/Pages/NewsArchivePage/NewsArchivePage";
import OperationalMessageArticlePage from "./Components/Pages/OperationalMessageArticlePage/OperationalMessageArticlePage";
import OperationalMessageArchivePage from "./Components/Pages/OperationalMessageArchivePage/OperationalMessageArchivePage";
import Error404Page from "./Components/Pages/Error404Page/Error404Page";
import ProviderPage from "./Components/Pages/ProviderPage/ProviderPage";
import SchemaOverviewPageRaw from "./Components/Pages/SchemaOverviewPage/SchemaOverviewPage";
import SchemaAttachmentPage from "./Components/Pages/SchemaAttachmentPage/SchemaAttachmentPage";
import SchemaPage from "./Components/Pages/SchemaPage/SchemaPage";
import SearchPageRaw from "./Components/Pages/SearchPage/SearchPage";
import SectionPage from "./Components/Pages/SectionPage/SectionPage";
import StartPage from "./Components/Pages/StartPage/StartPage";
import SubCategoryPage from "./Components/Pages/SubCategoryPage/SubCategoryPage";
import SubsidyOverviewPageRaw from "./Components/Pages/SubsidyOverviewPage/SubsidyOverviewPage";
import SubsidyPage from "./Components/Pages/SubsidyPage/SubsidyPage";
import ThemePage from "./Components/Pages/ThemePage/ThemePage";
import ContentArea from "./Components/Shared/ContentArea/ContentArea";
import Image from "./Components/Shared/Image/Image";
import OperationalMessage from "./Components/Shared/OperationalMessage/OperationalMessage";
import RichText from "./Components/Shared/RichText/RichText";
import RichTextArea from "./Components/Shared/RichTextArea/RichTextArea";
import RichTextMetadata from "./Components/Shared/RichTextMetadata/RichTextMetadata";
import IconItemsInline from "./Components/Shared/IconItemsInline/IconItemsInline";
import SearchFormRaw from "./Components/Shared/SearchForm/SearchForm";
import SearchInputRaw from "./Components/Shared/SearchInput/SearchInput";
import MunicipalityCountySearchRaw from "./Components/Shared/MunicipalityCountySearch/MunicipalityCountySearch";
import PromoBoxBlock from "./Components/Blocks/PromoBoxBlock/PromoBoxBlock";
import BannerBlockRaw from "./Components/Blocks/BannerBlock/BannerBlock";

const SearchPage = withIsland("SearchPage", SearchPageRaw);
const HelpSearchPage = withIsland("HelpSearchPage", HelpSearchPageRaw);
const SubsidyOverviewPage = withIsland("SubsidyOverviewPage", SubsidyOverviewPageRaw);
const SchemaOverviewPage = withIsland("SchemaOverviewPage", SchemaOverviewPageRaw);
const NewsArchivePage = withIsland("NewsArchivePage", NewsArchivePageRaw);
const ContactListBlock = withIsland("ContactListBlock", ContactListBlockRaw);
const ProviderContactInformationBlock = withIsland("ProviderContactInformationBlock", ProviderContactInformationBlockRaw);
const ContactFormBlock = withIsland("ContactFormBlock", ContactFormBlockRaw);
const ModalButtonBlock = withIsland("ModalButtonBlock", ModalButtonBlockRaw);
const BoxBlock = withIsland("BoxBlock", BoxBlockRaw);
const DoYouNeedHelpBlock = withIsland("DoYouNeedHelpBlock", DoYouNeedHelpBlockRaw);
const AccordianThemeBlock = withIsland("AccordianThemeBlock", AccordianThemeBlockRaw);
const SearchForm = withIsland("SearchForm", SearchFormRaw);
const ContactFormModal = withIsland("ContactFormModal", ContactFormModalRaw);
const ContactFormPageTrigger = withIsland("ContactFormPageTrigger", ContactFormPageTriggerRaw);
// Used inside otherwise static pages (StartPage, HelpStartPage, SchemaPage).
const SearchInput = withIsland("SearchInput", SearchInputRaw);
const MunicipalityCountySearch = withIsland("MunicipalityCountySearch", MunicipalityCountySearchRaw);

const BannerBlock = withIsland(
  "BannerBlock",
  (props: ComponentProps<typeof BannerBlockRaw>) =>
    createElement(BannerBlockRaw, props),
);
// BoxBlock under the names its transformers emit.
const LinkBox = withIsland("LinkBox", BoxBlockRaw);
const ModalBox = withIsland("ModalBox", BoxBlockRaw);

export {
  SiteLayout,
  SchemaAttachmentPage,
  SchemaPage,
  SchemaOverviewPage,
  HeroArticlePageBase,
  ContentArea,
  RichTextArea,
  RichTextMetadata,
  RichText,
  SchemaAccordianBlock,
  ContactListBlock,
  OperationalMessage,
  ProviderContactInformationBlock,
  ContactFormBlock,
  ContactFormTextBlock,
  ContactFormSiteBlockData,
  Image,
  SubCategoryPage,
  SubsidyOverviewPage,
  SubsidyPage,
  SearchPage,
  SectionPage,
  ThemePage,
  TimelineBlock,
  CategoryPage,
  ProviderPage,
  ModalButtonBlock,
  LinkButtonBlock,
  BoxBlock,
  LinkBox,
  ModalBox,
  LinkBlock,
  LinkListBlock,
  AccordionBlock,
  AccordianCollectionBlock,
  AccordianThemeBlock,
  BudgetBlock,
  CampaignBlock,
  CompareBlock,
  RichTextBlock,
  ContentBlock,
  DoYouNeedHelpBlock,
  EGuideStartBlock,
  HelpBlock,
  HelpContactBlock,
  HelpPhoneBlock,
  AdvisorStartBlock,
  LoginBlock,
  AlternativeLoginBlock,
  QuoteBlock,
  QuoteWithImageBlock,
  RelevantSchemasBlock,
  HelpStartPage,
  HelpQuestionPage,
  HelpSearchPage,
  HelpLandingPage,
  HelpPage,
  HelpProcessArticlePage,
  HelpDrilldownPage,
  NewsArchivePage,
  OperationalMessageArticlePage,
  OperationalMessageArchivePage,
  Error404Page,
  StartPage,
  PromoBoxBlock,
  BannerBlock,
  SubscriptionBlock,
  ThirdPartySubscriptionBlock,
  PhoneContactBlock,
  SocialNetworkContactBlock,
  AboutPage,
  UrlBlock,
  IconItemsInline,
  PlainLinkBlock,
  LatestNewsBlock,
  LatestNewsBlockV2,
  SearchForm,
  SearchInput,
  MunicipalityCountySearch,
  TableBlock,
  ContactFormModal,
  ContactFormPageTrigger,
  VectorImageBlock,
  VideoBlock,
  VectorImageFile,
  ImageFile,
  VideoFile,
  GenericMedia
};

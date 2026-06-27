export type {
  EditorialContent,
  GetPublishedEditorialContentInput,
  GetPublishedPromotionsForContextInput,
  ProductContentEntityType,
  ProductContentMode,
  ProductContentStatus,
  Promotion,
  PromotionDisclosureLabel,
  PromotionPlacementType,
  StaticPage,
  StaticPageType,
} from './productContent.types';

export type {
  SubmitUserMessageInput,
  SubmitUserMessageResult,
  UserMessageKind,
  UserMessageReviewStatus,
} from './userMessageQueue.service';

export {
  getPublishedEditorialContent,
  getPublishedPromotionsForContext,
  getPublishedStaticPageBySlug,
} from './productContent.service';

export {
  submitContactMessage,
  submitCommunitySuggestion,
  submitUserMessage,
} from './userMessageQueue.service';

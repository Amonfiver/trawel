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

export {
  getPublishedEditorialContent,
  getPublishedPromotionsForContext,
  getPublishedStaticPageBySlug,
} from './productContent.service';

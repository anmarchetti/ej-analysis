import SiteSettings from 'models/enum/SiteSettings';

export const NUMBER_OF_DAYS_BEFORE_DEPARTURE = 28;

export enum Colors {
    Grey = 'Grey',
    Green = 'Green',
}

export enum PromotionalMessagesTypes {
    Deposit = 'Deposit',
    WithConfidenceLess28 = 'With Confidence Less Than 28',
    WithConfidenceMore28 = 'With Confidence More Than 28',
    AmberPolicyPillLess28 = 'Amber Policy Pill Less Than 28',
    AmberPolicyPillMore28 = 'Amber Policy Pill More Than 28',
    RedPolicyPillLess28 = 'Red Policy Pill Less Than 28',
    RedPolicyPillMore28 = 'Red Policy Pill More Than 28',
}

export const PROMOTIONAL_MESSAGES_VISIBILITY_SETTINGS = {
    [PromotionalMessagesTypes.Deposit]: SiteSettings.DepositPill,
    [PromotionalMessagesTypes.WithConfidenceLess28]: SiteSettings.WithConfidenceLessThan28Message,
    [PromotionalMessagesTypes.WithConfidenceMore28]: SiteSettings.WithConfidenceMoreThan28Message,
};

export const PROMOTIONAL_MESSAGES_DATA_TID = {
    [PromotionalMessagesTypes.Deposit]: 'deposit-promo-message',
    [PromotionalMessagesTypes.WithConfidenceLess28]: 'best-price-guarantee-promo-mes',
    [PromotionalMessagesTypes.WithConfidenceMore28]: 'refund-guarantee-promo-mes',
    [PromotionalMessagesTypes.AmberPolicyPillLess28]: 'amber-policy-pill-less-28',
    [PromotionalMessagesTypes.AmberPolicyPillMore28]: 'amber-policy-pill-more-28',
    [PromotionalMessagesTypes.RedPolicyPillLess28]: 'red-policy-pill-less-28',
    [PromotionalMessagesTypes.RedPolicyPillMore28]: 'red-policy-pill-more-28',
};

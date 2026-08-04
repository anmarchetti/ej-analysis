/* eslint-disable @typescript-eslint/naming-convention */
export enum ErrorPromocodeStatuses {
    PROMOCODE_REMOVED,
    TIER_DOWNGRADE,
    TIER_UPGRADE,
    ERROR,
}

/* eslint-disable @typescript-eslint/naming-convention */
export enum TierStatuses {
    TIER_DOWNGRADE = 'TIER_DOWNGRADE',
    TIER_UPGRADE = 'TIER_UPGRADE',
}

/* eslint-disable @typescript-eslint/naming-convention */
export enum PromocodeRestStatuses {
    NO_PROMOCODE = 'NO_PROMOCODE',
    APPLIED_ORIGINALLY = 'APPLIED_ORIGINALLY',
    PROMOCODE_REMOVED = 'PROMOCODE_REMOVED',
    ERROR = 'ERROR',
}

export const PromocodeStatuses = {
    ...TierStatuses,
    ...PromocodeRestStatuses,
};

export type TPromoCodeStatusesType = (typeof PromocodeStatuses)[keyof typeof PromocodeStatuses];

export interface IPromotionCodeTier {
    childDiscountAmountPerPerson?: number;
    childDiscountPercentagePerPerson?: number;
    discountAmountPerBooking?: number;
    discountAmountPerPerson?: number;
    discountPercentagePerPerson?: number;
    minimumSpend?: number;
    minimumSpendPerPerson?: number;
    percentageDiscountPerBooking?: number;
}

export interface ISinglePromotionInfo {
    cardDescription: string;
    bannerDescription?: string;
    bannerTitle?: string;
    childDiscountAmountPerPerson?: number;
    childDiscountPercentagePerPerson?: number;
    date?: string;
    description?: string;
    discountAmountPerBooking?: number;
    discountAmountPerPerson?: number;
    discountPercentagePerPerson?: number;
    displayOnExtrasPage?: boolean;
    icon?: string;
    minimumSpendText?: string;
    minimumSpendValue?: number;
    percentageDiscountPerBooking?: number;
    promoCode?: string;
    promotionCodeTiers?: IPromotionCodeTier[];
    showTaxesNote?: boolean;
    tandCs?: string;
    title?: string;
}

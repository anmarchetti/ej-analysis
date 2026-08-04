import { CurrencyCode } from 'code/currency';
import { RefundOption } from 'models/enum/RefundOptions';
import { VoucherTypes } from 'models/enum/VoucherTypes';
import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';

export interface IMyCreditInfo {
    balance: number;
    creditIsEnabled: boolean;
    currency: CurrencyCode;
    hasCreditHistory: boolean;
}

export interface IBookingRefundResponse {
    cash: number;
    credit: IMyCreditInfo;
    credits: number;
}

export interface IValidatedVoucher {
    active: boolean;
    amount: number;
    currency: CurrencyCode;
    userCurrentBalance: number;
    userNewBalance: number;
    voucherCode: string;
    voucherType: VoucherTypes;
}

export interface ICurrency {
    Code: ISitecoreField<string>;
}

export interface IMarket {
    Code: ISitecoreField<string>;
    Currency: ISitecoreCompositeField<ICurrency>;
}

export interface IMarketCredits {
    Flag: ISitecoreField<ISitecoreImage>;
    Market: ISitecoreCompositeField<IMarket>;
    ScreenReaderLabel: ISitecoreField<string>;
}

export interface IHolidayCreditFields {
    HelpLink: ISitecoreField<ISitecoreLink>;
    InfoText: ISitecoreField<string>;
    LoadingCreditHistoryLabel: ISitecoreField<string>;
    MarketCredits: ISitecoreCompositeField<IMarketCredits>[];
    MultipleCreditsInfo?: ISitecoreField<string>;
}

export interface IMarketTab extends IMyCreditInfo {
    flag?: ISitecoreField<ISitecoreImage>;
    screenReaderLabel?: ISitecoreField<string>;
}

export enum CreditExpiryState {
    None = 'None',
    ExpiredOnly = 'ExpiredOnly',
    ExpiringOnly = 'ExpiringOnly',
    Both = 'Both',
}

export interface ICancellationSummaryResponse {
    amendmentFeeAmount: number;
    currency: string;
    daysBeforeDeparture: number;
    isDestinationRulesApplied: boolean;
    oneTimeUseCreditTotalPaid: number;
    refundBreakdownValidationHash: number;
    refunds: IRefundOption[];
    cancellationFee?: number;
    creditExpiryState?: CreditExpiryState;
    originalBookingValue?: number;
}

export interface IRefundOption {
    credit: number;
    oneTimeUseCredit: number;
    refundOption: RefundOption;
    total: number;
    originalPayment?: number;
}

export interface IBookingCancellationResponse {
    bookingReference: string;
    cashRefundAmount: number;
    creditRefundAmount: number;
}

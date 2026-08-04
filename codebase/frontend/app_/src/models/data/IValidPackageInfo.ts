import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { GuestType } from 'models/enum/GuestType';

import { IMemo } from './IMemo';
import { IPaymentInfo } from './IPaymentInfo';
import { ISinglePromotionInfo } from './IPromocode';
import { ISelectedSeat } from './ISeatMapStore';
import { IPackageTaxesAndFees } from './ITouristTax';
import { ITransfer } from './ITransfer';

export interface IValidatePackageInfo {
    bookingStatus: string;
    creditIsEnabled: boolean;
    extraLuggageInfo: IExtraLuggageInfo;
    extraPriceBreakdown: IExtraPriceBreakdown[];
    paymentInfo: IPaymentInfo;
    priceBreakdown: IPriceBreakdownItem[];
    requestId: string;
    tradeAgentPriceBreakdown: IPriceBreakdownItem[];
    transfers: ITransfer[];
    Prom?: string;
    guests?: IGuest[];
    memos?: IMemo[];
    promotion?: ISinglePromotionInfo;
    seatSelection?: ISelectedSeat[];
    taxesAndFees?: IPackageTaxesAndFees[];
}

export interface IPriceBreakdownItem {
    amount: number;
    code: string;
    name: string;
    quantity: number;
}

export interface IExtraPriceBreakdown extends IPriceBreakdownItem {
    subcategories?: IPriceBreakdownItem[];
}

export interface IGuest {
    age: number;
    index: string;
    isLead: boolean;
    notBornYet: boolean;
    sex: string;
    type: GuestType;
}

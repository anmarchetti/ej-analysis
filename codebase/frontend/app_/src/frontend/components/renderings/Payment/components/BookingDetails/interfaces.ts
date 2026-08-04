import { IBookingInfo } from 'models/data/IBookingInfo';
import { IPayBalancePageFields, IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';
import { ITradePortalConfirmBookingDetailsFields } from 'frontend/components/renderings/TradePortalConfirmBookingDetails/interfaces';

export type TBookingDetailsFields =
    | IPaymentPageFields
    | ITradePortalConfirmBookingDetailsFields
    | IPayBalancePageFields;

export interface IBookingDetailsProps {
    alwaysShowPriceBreakdownWithPromo?: boolean;
    booking?: IBookingInfo;
    className?: string;
    disableTouristTax?: boolean;
    fields?: TBookingDetailsFields;
    hideTotalWhenCollapsed?: boolean;
    isPayRemaining?: boolean;
    promoCode?: string;
    totalPriceLabel?: string;
}

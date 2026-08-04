import { IAmendPaymentInfo } from 'models/data/IAmendBookingFlights';
import { IUnit } from 'models/data/IOffer';
import { ITransfer } from 'models/data/ITransfer';

export interface IAmendHotelTrackingPayload {
    amendmentPaymentInfo: IAmendPaymentInfo;
    transfers: ITransfer[];
    unit: IUnit[];
}

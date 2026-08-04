import { TransferType } from 'models/enum/transfer/TransferType';
import { ILocation } from 'frontend/components/common/MapComponent/OldMap/MapDirectionsProptypes';

import { IAmendBookingPromoBreakDown } from './IAmendBookingFlights';

export interface ITransfer {
    autoInclude: boolean;
    code: string;
    content: string;
    id: string;
    method: string;
    name: string;
    paxs: string[];
    price: number;
    pricePP: number;
    prom: string;
    quantity: number;
    rateRule: string;
    serviceStates: string[];
    setType: string[];
    startDate: string;
    type: TransferType;
    typeCode: string[];
    iconUrl?: string;
    isHidden?: boolean;
    largeSeSurcharge?: number;
    smallSeSurcharge?: number;
    transferInfo?: {
        arrivalInstr?: string;
        depInstr?: string;
        duration?: number;
    };
}

export interface ITransferWithAmendmentCharges {
    amendmentCharges: number;
    transfer: ITransfer;
    errataFlightInfo?: string[];
    promoCodeBreakDown?: IAmendBookingPromoBreakDown;
}

export interface IBookingTransfer {
    airport?: string;
    pickupDate?: string;
    pickupLocation?: ILocation;
    pickupLocationInstructions?: string;
    pickupLocationName?: string;
    pickupTime?: string;
    transferMinutes?: number;
    transferType?: TransferType;
    vehicle?: {
        provider: string;
        vehicleColour: string;
        vehicleDriverName: string;
        vehicleDriverPhone: string;
        vehicleRegistration: string;
        vehicleType: string;
    };
    what3WordsLocation?: string;
}
export interface IBookingTransfers {
    bookingReference: string;
    inboundTransferDetails: IBookingTransfer;
    outboundTransferDetails: IBookingTransfer;
}

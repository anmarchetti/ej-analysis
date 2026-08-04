import { CurrencyCode } from 'code/currency';
import { IAltRoom } from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';

import { IBoardType } from './IHotel';
import { IAccomData, IBaseUnit, ITransport } from './IOffer';
import { ITransfer } from './ITransfer';

export interface IAlternativeOffers {
    offers: IAlternativeOffer[];
}

export interface IAlternativeOffer {
    accom: IAccomData<IBaseUnit>;
    date: string;
    hasDistressedFlights: boolean;
    id: string;
    price: number;
    pricePP: number;
    stay: number;
    touristTax: number;
    transfers: ITransfer[];
    transport: ITransport;
    accommodationId?: string;
    board?: string;
    boardType?: IBoardType;
    currency?: { code: CurrencyCode };
    deposit?: number;
    distanceToOriginalAirport?: number;
    inboundRouteId?: string;
    outboundRouteId?: string;
    rooms?: IAltRoom[];
}

import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { GuestInfo } from 'models/GuestInfo';

import { IAirportParking } from './externalExtras/IAirportParking';
import { IOfferWithShortenHotelData } from './IOffer';

export interface IValidateBookingRequestBody {
    guests: GuestInfo[];
    offer: IOfferWithShortenHotelData;
    airportParking?: IAirportParking | null;
    bookingToken?: string;
    discount?: string;
    extraLuggageInfo?: IExtraLuggageInfo | null;
    norounding?: boolean;
    seatSelection?: ISelectedSeat[];
}

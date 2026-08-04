import { IHotel } from 'models/data/IHotel';

import { IAmendHotelOffer } from './AmendHotel';

export interface IAmendSelectedHotelDetails {
    amendHotelOffer: IAmendHotelOffer;
    hotel: IHotel;
}

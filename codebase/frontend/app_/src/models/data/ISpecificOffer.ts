import { IHotel } from './IHotel';
import { IAltAccommodation, IOfferWithoutAltBoards } from './IOffer';

export interface ISpecificOffer {
    hotel: IHotel;
    offers: IOfferWithoutAltBoards[];
}

export interface ISpecificOfferWithAltAcc extends ISpecificOffer {
    altAcc?: IAltAccommodation[];
}

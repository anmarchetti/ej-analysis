import { Availability } from 'models/enum/Availability';

export interface IATCoreOffer {
    '@Avail': Availability;
    '@Date': string;
    '@Stay': string;
    Accom: {
        '@Name': string;
        Unit: {
            '@Name': string;
            '@Price': string;
            '@PricePP': string;
        };
    };
}

export interface IATCoreOffers {
    Offers: {
        '@Count': string;
        Offer: IATCoreOffer[] | IATCoreOffer;
    };
}

import {
    getIsTouristTaxDisplayed,
    getTouristTaxFieldsFromOffer,
    getTouristTaxPrice,
} from 'frontend/utils/touristTax.utils';
import { IOffer } from 'models/data/IOffer';

interface IGetTouristTaxInfoArgs {
    isTouristTaxEnabled: boolean;
    offer: IOffer;
}

interface IGetTouristTaxInfoData {
    isTouristTaxDisplayed: boolean;
    touristTax: number;
}

export const getTouristTaxInfo = ({ offer, isTouristTaxEnabled }: IGetTouristTaxInfoArgs): IGetTouristTaxInfoData => {
    if (!isTouristTaxEnabled)
        return {
            isTouristTaxDisplayed: false,
            touristTax: 0,
        };

    const { touristTax: rawTouristTax } = getTouristTaxFieldsFromOffer(offer);
    const isTouristTaxDisplayed = getIsTouristTaxDisplayed({ isTouristTaxEnabled, touristTax: rawTouristTax });

    return {
        touristTax: getTouristTaxPrice(rawTouristTax),
        isTouristTaxDisplayed,
    };
};

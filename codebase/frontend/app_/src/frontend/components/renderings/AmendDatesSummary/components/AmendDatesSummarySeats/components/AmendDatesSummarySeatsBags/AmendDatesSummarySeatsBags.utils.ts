import { getLuggageTypes, ILuggageAmount } from 'frontend/utils/luggage.utils';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

interface ILuggageMetaData {
    luggage: ILuggageAmount;
    name: SitecoreDictionary;
    weightLabel: SitecoreDictionary;
}

export const getLuggageMetaData = (luggageInfo: IExtraLuggageInfo): ILuggageMetaData[] => {
    const bagsTypes = getLuggageTypes(luggageInfo);

    return bagsTypes.map(luggage => {
        const name =
            luggage.amount > 1
                ? SitecoreDictionary.LuggageLabelsHoldBagsPlural
                : SitecoreDictionary.LuggageLabelsHoldBagSingular;
        const weightLabel = SitecoreDictionary[`LuggageLabels${luggage.type}Weight`];

        return {
            luggage,
            name,
            weightLabel,
        };
    });
};

import { Tokens } from 'code/tokens';
import { TStores } from 'frontend/store/IStores';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import { ILuggageInformationFields, IRecommendedHotelsFields } from 'models/data/IRecommendedHotels';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import useStore from './useStore';

export const useLuggageTextFromOfferAndFields = (
    offer: IOffer,
    fields: IRecommendedHotelsFields | ILuggageInformationFields | undefined,
    isShortText?: boolean,
): string => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isLuxuryPackage = containsLuxuryPromoCode(offer.promoCollections);

    // For luxury internal flight ATCOM returns 23 kg, we need to show 26, so we need this code below
    if (isLuxuryPackage) {
        return isShortText
            ? getPhrase(SitecoreDictionary.LuggageLabels26kgHoldBagSingular)
            : getPhrase(SitecoreDictionary.LuxuryLabelsLuxuryHoldBagIncluded);
    }

    const isExtraLuggage = !!offer.extraLuggageInfo?.items?.length;
    const numbers = isExtraLuggage ? offer.extraLuggageInfo?.items[0]?.name?.replace(/\D/g, '') ?? '' : '';
    const { DefaultText, HoldBagText } = fields ?? {};

    const text = isExtraLuggage
        ? Tokenizer.replaceTokens(HoldBagText?.value, {
              [Tokens.Number]: numbers,
          })
        : DefaultText?.value;

    return text ?? '';
};

import { FC } from 'react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTouristTaxPrice, INVALID_TAX_VALUE } from 'frontend/utils/touristTax.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './TouristTaxPriceLabel.module.scss';

export interface ITouristTaxPriceLabel {
    isPricePP: boolean;
    price: number;
    pricePP: number;
    touristTax: number;
    touristTaxPP: number;
}

const currencyFormatOptions = {
    roundUp: true,
    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
};

export const TouristTaxPriceLabel: FC<ITouristTaxPriceLabel> = ({
    isPricePP,
    touristTax,
    touristTaxPP,
    price,
    pricePP,
}) => {
    const { getPhrase, isTouristTaxEnabled, formatMoney } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const touristTaxValue = isPricePP ? touristTaxPP : touristTax;
    const priceValue = isPricePP ? pricePP : price;

    if (!isTouristTaxEnabled || touristTaxValue === INVALID_TAX_VALUE) {
        return null;
    }

    const roundedTouristTaxValue = getTouristTaxPrice(touristTaxValue);
    const formattedPriceWithTouristTax = formatMoney(priceValue, currencyFormatOptions);
    const formattedTouristTax = formatMoney(roundedTouristTaxValue, currencyFormatOptions);

    const touristTaxLabelPhrase = isPricePP
        ? getPhrase(SitecoreDictionary.TouristTaxLabelsAddLocalTaxPerPerson)
        : getPhrase(SitecoreDictionary.TouristTaxLabelsAddLocalTax);

    const label =
        roundedTouristTaxValue === 0
            ? getPhrase(SitecoreDictionary.TouristTaxLabelsTaxNotApplicable)
            : Tokenizer.replaceTokens(touristTaxLabelPhrase, {
                  [Tokens.TouristTax]: formattedTouristTax,
                  [Tokens.Price]: formattedPriceWithTouristTax,
              });

    return <RichTextWithLinks tag='span' className={styles.label} field={{ value: label }} />;
};

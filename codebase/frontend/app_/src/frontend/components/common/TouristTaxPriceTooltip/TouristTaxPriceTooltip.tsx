import { FC, ReactNode } from 'react';

import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { INVALID_TAX_VALUE } from 'frontend/utils/touristTax.utils';
import { TTaxesAndFees } from 'models/data/ITouristTax';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TouristTaxTooltip } from 'frontend/components/common/TouristTaxTooltip/TouristTaxTooltip';

import { getMultiCurrencyTokens, getSingleCurrencyTokens } from './TouristTaxPriceTooltip.utils';

export interface ITouristTaxPriceTooltipProps {
    children: ReactNode;
    taxesAndFees: TTaxesAndFees | undefined;
    touristTax: number;
    text?: string;
    triggerClassName?: string;
}

export const TouristTaxPriceTooltip: FC<ITouristTaxPriceTooltipProps> = ({
    children,
    taxesAndFees,
    touristTax,
    triggerClassName,
    text: customText,
}) => {
    const { getPhrase, isTouristTaxEnabled } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));

    if (touristTax === INVALID_TAX_VALUE) {
        return null;
    }

    const childrenFragment = <>{children}</>;

    if (!isTouristTaxEnabled) {
        return childrenFragment;
    }

    const isMultiCurrency = !!taxesAndFees && Object.keys(taxesAndFees).length > 1;

    let defaultTooltipText: string;

    if (touristTax === 0) {
        defaultTooltipText = getPhrase(SitecoreDictionary.TouristTaxTooltipsNoTaxTooltip);
    } else if (isMultiCurrency) {
        const multiCurrencyTokens = getMultiCurrencyTokens(
            touristTax,
            taxesAndFees,
            getPhrase(SitecoreDictionary.GlobalConjunctionsAnd),
        );
        defaultTooltipText = Tokenizer.replaceTokens(
            getPhrase(SitecoreDictionary.TouristTaxTooltipsMultiCurrencyContent),
            multiCurrencyTokens,
        );
    } else {
        const taxEntry = taxesAndFees ? Object.values(taxesAndFees)[0] : undefined;

        if (!taxEntry) {
            return childrenFragment;
        }

        const singleCurrencyTokens = getSingleCurrencyTokens(touristTax, taxEntry);
        defaultTooltipText = Tokenizer.replaceTokens(
            getPhrase(SitecoreDictionary.TouristTaxTooltipsExchangeTaxContent),
            singleCurrencyTokens,
        );
    }

    return (
        <TouristTaxTooltip
            triggerClassName={triggerClassName}
            tooltipText={customText || defaultTooltipText}
            dataId='tax-price-tooltip-label'
        >
            {children}
        </TouristTaxTooltip>
    );
};

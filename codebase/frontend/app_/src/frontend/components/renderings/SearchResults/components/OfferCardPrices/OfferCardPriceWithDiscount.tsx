import { FC } from 'react';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { ITouristTaxOfferFields } from 'models/data/ITouristTaxOfferFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import { TouristTaxPriceLabel } from 'frontend/components/common/TouristTaxPriceLabel/TouristTaxPriceLabel';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';

import styles from './OfferCardPriceWithDiscount.module.scss';

export interface IOfferCardPriceWithDiscount extends ITouristTaxOfferFields {
    isPricePP: boolean;
    labelAfterPrice: string;
    labelBeforePrice: string;
    price: number;
    priceBeforeDiscount: number;
    priceExcludingTouristTax: number;
    pricePP: number;
    pricePPExcludingTouristTax: number;
    currency?: CurrencyCode;
    tooltipMessage?: string;
}

export const OfferCardPriceWithDiscount: FC<IOfferCardPriceWithDiscount> = ({
    price,
    pricePP,
    priceExcludingTouristTax,
    pricePPExcludingTouristTax,
    priceBeforeDiscount,
    labelBeforePrice,
    labelAfterPrice,
    currency,
    tooltipMessage,
    touristTax,
    touristTaxPP,
    isPricePP,
    taxesAndFees,
}) => {
    const { formatMoney, getPhrase, isOffersPriceViewTotal } = useStore(stores => ({
        formatMoney: stores.marketStore.formatMoney,
        getPhrase: stores.layoutStore.getPhrase,
        isOffersPriceViewTotal: stores.layoutStore.isOffersPriceViewTotal,
    }));
    const priceValue = isPricePP ? pricePPExcludingTouristTax : priceExcludingTouristTax;
    const discountTooltip = getPhrase(SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount);
    const tooltipText = tooltipMessage || discountTooltip;

    return (
        <>
            <div className={styles.priceWithDiscountWrapper} data-tid='price-with-discount-wrapper'>
                <div>
                    <div className={styles.discountWrapper} data-tid='discount-price-wrapper'>
                        {labelBeforePrice && <span data-tid='from-label'>{labelBeforePrice}</span>}
                        <div className={styles.discountPrice}>
                            <span data-tid='discount-price'>
                                {formatMoney(priceBeforeDiscount, { currency, maximumFractionDigits: 0 })}
                            </span>
                            {labelAfterPrice && <span data-tid='label-after-discount-price'>{labelAfterPrice}</span>}
                        </div>
                    </div>
                </div>
                <div className={styles.currentPriceWrapper} data-tid='price-wrapper'>
                    <span className={styles.currentPrice} data-tid='after-discount-price'>
                        {formatMoney(priceValue, { currency, maximumFractionDigits: 0 })}
                    </span>
                    {labelAfterPrice && (
                        <span className={styles.afterPriceLabel} data-tid='label-after-current-price'>
                            {labelAfterPrice}
                        </span>
                    )}

                    {tooltipText && (
                        <Tooltip>
                            <TooltipTrigger className={styles.tooltipTrigger} />
                            <TooltipContent>
                                <div className={styles.contentWrapper}>
                                    {tooltipMessage && <div data-tid='price-tooltip-message'>{tooltipMessage}</div>}
                                    {discountTooltip && (
                                        <div data-tid='discount-tooltip-message'>{discountTooltip}</div>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
            <TouristTaxPriceTooltip touristTax={touristTax} taxesAndFees={taxesAndFees}>
                <TouristTaxPriceLabel
                    touristTax={touristTax}
                    touristTaxPP={touristTaxPP}
                    isPricePP={!isOffersPriceViewTotal}
                    price={price}
                    pricePP={pricePP}
                />
            </TouristTaxPriceTooltip>
        </>
    );
};

export default observer(OfferCardPriceWithDiscount);

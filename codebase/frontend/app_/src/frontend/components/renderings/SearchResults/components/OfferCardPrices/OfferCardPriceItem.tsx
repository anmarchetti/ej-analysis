import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { ITouristTaxOfferFields } from 'models/data/ITouristTaxOfferFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import { TouristTaxPriceLabel } from 'frontend/components/common/TouristTaxPriceLabel/TouristTaxPriceLabel';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';
import styles from 'frontend/components/renderings/SearchResults/components/OfferCardNew/OfferCardNew.module.scss';

import OfferCardPriceWithDiscount from './OfferCardPriceWithDiscount';

export interface IOfferCardPriceItemProps extends ITouristTaxOfferFields {
    currency: CurrencyCode | undefined;
    isPricePP: boolean;
    price: number;
    priceDictionary: SitecoreDictionary | undefined;
    priceExcludingTouristTax: number;
    pricePP: number;
    pricePPExcludingTouristTax: number;
    className?: string;
    discount?: number;
    taxTooltipTriggerClassName?: string;
    tooltipMessage?: string;
    wrapperClassName?: string;
}

export const OfferCardPriceItem: FC<IOfferCardPriceItemProps> = ({
    price,
    pricePP,
    priceExcludingTouristTax,
    pricePPExcludingTouristTax,
    priceDictionary,
    currency,
    tooltipMessage,
    className,
    wrapperClassName,
    taxTooltipTriggerClassName,
    discount = 0,
    isPricePP,
    touristTax,
    touristTaxPP,
    taxesAndFees,
}) => {
    const { formatMoney, areStrikethroughPricesEnabled } = useStore(stores => ({
        formatMoney: stores.marketStore.formatMoney,
        areStrikethroughPricesEnabled: stores.layoutStore.areStrikethroughPricesEnabled,
    }));
    const priceToShow = isPricePP ? pricePPExcludingTouristTax : priceExcludingTouristTax;
    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(priceDictionary);

    if (discount) {
        return (
            <OfferCardPriceWithDiscount
                labelAfterPrice={labelAfterPrice}
                labelBeforePrice={labelBeforePrice}
                price={price}
                pricePP={pricePP}
                priceExcludingTouristTax={priceExcludingTouristTax}
                pricePPExcludingTouristTax={pricePPExcludingTouristTax}
                tooltipMessage={tooltipMessage}
                priceBeforeDiscount={priceToShow + discount}
                currency={currency}
                touristTax={touristTax}
                touristTaxPP={touristTaxPP}
                isPricePP={isPricePP}
                taxesAndFees={taxesAndFees}
            />
        );
    }

    return (
        <div className={wrapperClassName}>
            <div
                data-tid='price-with-label-wrapper'
                className={classNames('price-big', className, styles.priority, {
                    [styles.priceWithEnabledDiscountWrapper]: areStrikethroughPricesEnabled,
                })}
            >
                {labelBeforePrice && (
                    <span data-tid='from-label' className='price-big__from-label'>
                        {labelBeforePrice}
                    </span>
                )}
                <span className='price-big__price-info' data-tid='price-wrapper'>
                    <span className='price-big__value'>
                        {formatMoney(priceToShow, { currency, maximumFractionDigits: 0 })}
                    </span>

                    {labelAfterPrice && <span className='price-big__subtext'>{labelAfterPrice}</span>}

                    {tooltipMessage && (
                        <Tooltip>
                            <TooltipTrigger className={styles.tooltipTrigger} />
                            <TooltipContent text={tooltipMessage} />
                        </Tooltip>
                    )}
                </span>
            </div>
            <TouristTaxPriceTooltip
                touristTax={touristTax}
                taxesAndFees={taxesAndFees}
                triggerClassName={taxTooltipTriggerClassName}
            >
                <TouristTaxPriceLabel
                    touristTax={touristTax}
                    touristTaxPP={touristTaxPP}
                    isPricePP={isPricePP}
                    price={price}
                    pricePP={pricePP}
                />
            </TouristTaxPriceTooltip>
        </div>
    );
};

export default observer(OfferCardPriceItem);

import React, { FC } from 'react';
import classNames from 'classnames';

import { ICurrencyFormatOptions } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import {
    getPricePill,
    getTotalDiscount,
    getTotalDiscountPPExcludingInfants,
    isPricePPShown,
} from 'frontend/utils/offer.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import { TouristTaxPriceLabel } from 'frontend/components/common/TouristTaxPriceLabel/TouristTaxPriceLabel';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';

import styles from './HolidayPrice.module.scss';

interface IHolidayPriceProps {
    offer: IOffer;
}

export const HolidayPrice: FC<IHolidayPriceProps> = ({ offer }) => {
    const { tooltipSettings, formatMoney } = useStore(stores => ({
        tooltipSettings: stores.layoutStore.tooltipSettings,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const tooltipMessage = getPricePill(tooltipSettings, offer);

    const tooltip = tooltipMessage ? (
        <Tooltip>
            <TooltipTrigger className={classNames(styles.tooltipContainer, 'ms-1')} />
            <TooltipContent>
                <div>{tooltipMessage}</div>
            </TooltipContent>
        </Tooltip>
    ) : undefined;

    const currencyOptions: ICurrencyFormatOptions = {
        currency: offer.currency?.code,
        maximumFractionDigits: 0,
    };
    const { touristTax, touristTaxPP, taxesAndFees } = getTouristTaxFieldsFromOffer(offer);

    const isPricePPDefined = isPricePPShown(offer);

    const discountPP = getTotalDiscountPPExcludingInfants(offer);
    const discount = getTotalDiscount(offer);

    const priceValue = isPricePPDefined ? offer.pricePPExcludingTouristTax : offer.priceExcludingTouristTax;
    const discountValue = isPricePPDefined ? discountPP : discount;
    const preDiscountPrice = priceValue + discountValue;

    const hasDiscount = discount > 0 || discountPP > 0;

    const discountPriceDicionary = isPricePPDefined
        ? SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom
        : SitecoreDictionary.GlobalsPriceLabelsTotalFrom;

    const getPriceDictionary = (): SitecoreDictionary | undefined => {
        if (hasDiscount) {
            return isPricePPDefined ? SitecoreDictionary.GlobalsPriceLabelsPerPerson : undefined;
        }

        return isPricePPDefined
            ? SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom
            : SitecoreDictionary.GlobalsPriceLabelsTotalFrom;
    };

    const renderPreDiscountPricePrefix = (label): JSX.Element => (
        <span className={styles.preDiscountPrefix}>{label}</span>
    );

    const renderPricePrefix = (label): JSX.Element => <span className={styles.pricePrefix}>{label}</span>;

    const priceLabelDataTid = isPricePPDefined ? 'price-pp' : 'total-price';

    return (
        <div className={styles.priceBlock} data-tid='hotel-price-block'>
            <div className={styles.discountPriceWrapper}>
                {hasDiscount && (
                    <PriceLabel
                        tag='div'
                        className={styles.preDiscountPrice}
                        price={
                            <span data-tid='pre-discount-price'>{formatMoney(preDiscountPrice, currencyOptions)}</span>
                        }
                        wrapLabelBeforePrice={renderPreDiscountPricePrefix}
                        priceDictionary={discountPriceDicionary}
                    />
                )}
            </div>
            <PriceLabel
                tag='div'
                className={styles.price}
                price={<span data-tid={priceLabelDataTid}>{formatMoney(priceValue, currencyOptions)}</span>}
                wrapLabelBeforePrice={renderPricePrefix}
                priceDictionary={getPriceDictionary()}
                tooltip={tooltip}
            />

            <TouristTaxPriceTooltip
                touristTax={touristTax}
                taxesAndFees={taxesAndFees}
                triggerClassName={styles.tooltipTrigger}
            >
                <TouristTaxPriceLabel
                    touristTax={touristTax}
                    touristTaxPP={touristTaxPP}
                    isPricePP={isPricePPDefined}
                    price={offer.price}
                    pricePP={offer.pricePP}
                />
            </TouristTaxPriceTooltip>
        </div>
    );
};

export default HolidayPrice;

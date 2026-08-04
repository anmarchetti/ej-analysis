import React, { FunctionComponent, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getCurrencyFormatOptions } from 'frontend/utils/summaryDetails.utils';
import { getTouristTaxSummaryData } from 'frontend/utils/touristTax.ui.utils';
import { getIsTouristTaxDisplayed, getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FlightPlusHotelDiscountPrice from 'frontend/components/common/FlightPlusHotelDiscountPrice';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';
import { createFphData, getPriceBreakdown } from 'frontend/components/renderings/Payment/Payment.utils';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';
import summaryDetailsStyles from 'frontend/components/renderings/SummaryBar/SummaryDetails/SummaryDetails.module.scss';

import styles from './SummaryPriceDetails.module.scss';

const SummaryPriceDetails: FunctionComponent<ISummaryBarSitecoreFields> = ({
    PriceSectionTotal,
    CommonFieldsItemIncluded,
}) => {
    const {
        formatMoney,
        packageInfo,
        offer,
        totalPriceWithTouristTax,
        totalPrice,
        isTouristTaxEnabled,
        isFlightAndHotelPackage,
        getPhrase,
        flightPlusHotelDiscount,
    } = useStore((stores: TStores) => ({
        formatMoney: stores.marketStore.formatMoney,
        packageInfo: stores.bookingStore.packageInfo,
        offer: stores.bookingStore.selectedOffer,
        totalPriceWithTouristTax: stores.bookingStore.totalPriceWithTouristTax,
        totalPrice: stores.bookingStore.totalPrice,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        isFlightAndHotelPackage: isHolidayStore(stores) && stores.bookingStore.isFlightAndHotelPackage,
        getPhrase: stores.layoutStore.getPhrase,
        flightPlusHotelDiscount: stores.bookingStore.flightPlusHotelDiscount,
    }));

    const totalCostHighlightExperiment = useExperiment(ExperimentTestIds.SummaryBarTotalCostHighlight);
    const isHolidayPackageCostHighlighted = totalCostHighlightExperiment?.testVariant === ExperimentVariants.VariantB;

    const fphData = useMemo(
        () => createFphData(getPhrase, isFlightAndHotelPackage, flightPlusHotelDiscount),
        [getPhrase, isFlightAndHotelPackage, flightPlusHotelDiscount],
    );

    if (!packageInfo) return null;

    const { extraPriceBreakdown, priceBreakdown } = packageInfo;

    const { touristTax, taxesAndFees } = getTouristTaxFieldsFromOffer(offer);

    const { label: touristTaxLabel, trigger: touristTaxTrigger } = getTouristTaxSummaryData({
        price: touristTax,
    });

    const isTouristTaxDisplayed = getIsTouristTaxDisplayed({ isTouristTaxEnabled, touristTax });

    const priceBreakdownList = getPriceBreakdown(
        undefined,
        extraPriceBreakdown,
        priceBreakdown,
        isTouristTaxDisplayed,
        fphData,
    );

    return (
        <div
            className={classNames(summaryDetailsStyles.category, styles.categoryPrice, {
                [styles.packageCostHighlightedWrapper]: isHolidayPackageCostHighlighted,
            })}
            data-tid='summary-bar-price-details'
        >
            {priceBreakdownList
                ?.slice()
                .sort((a, b) => b.amount - a.amount)
                .map((breakdownItem, idx) => (
                    <div
                        key={'breakdown__item__' + idx}
                        className={classNames(styles.item, { [styles.discount]: breakdownItem.amount < 0 })}
                    >
                        <span data-tid='price-details-holiday-label'>{breakdownItem.name}</span>
                        <span data-tid='price-details-holiday-value'>
                            {breakdownItem.amount === 0
                                ? CommonFieldsItemIncluded.value
                                : formatMoney(
                                      breakdownItem.amount,
                                      getCurrencyFormatOptions(packageInfo?.paymentInfo?.currency),
                                  )}
                        </span>
                    </div>
                ))}

            <FlightPlusHotelDiscountPrice
                isFph={fphData.isFph}
                discount={fphData.discount}
                wrapperClassName={classNames(styles.item, styles.fphDiscount)}
                priceClassName={styles.price}
                formattedDiscount={formatMoney(
                    fphData.discount,
                    getCurrencyFormatOptions(packageInfo?.paymentInfo?.currency),
                )}
            />

            {isTouristTaxDisplayed && (
                <>
                    <div
                        className={classNames(styles.item, styles.packageCost, {
                            [styles.includeBorder]: priceBreakdownList?.length,
                            [styles.fphPackageCost]: fphData.isFph,
                        })}
                        data-tid='summary-package-cost'
                    >
                        <RichTextDictionary
                            tag='p'
                            dictionaryKey={
                                fphData.isFph
                                    ? SitecoreDictionary.FlightPlusHotelPricesPackageCost
                                    : SitecoreDictionary.TouristTaxLabelsHolidayPackageCost
                            }
                        />
                        <div className={styles.price}>
                            {formatMoney(totalPrice, getCurrencyFormatOptions(packageInfo?.paymentInfo?.currency))}
                        </div>
                    </div>
                    <div className={classNames(styles.item, styles.localTax)}>
                        {touristTaxLabel}

                        <TouristTaxPriceTooltip touristTax={touristTax} taxesAndFees={taxesAndFees}>
                            {touristTaxTrigger}
                        </TouristTaxPriceTooltip>
                    </div>
                </>
            )}

            <div className={classNames(styles.item, styles.total)} data-tid='summary-total-price'>
                <span data-tid='price-details-total-label'>{PriceSectionTotal.value}</span>
                <span data-tid='price-details-total-value'>
                    {formatMoney(
                        totalPriceWithTouristTax,
                        getCurrencyFormatOptions(packageInfo?.paymentInfo?.currency),
                    )}
                </span>
            </div>
        </div>
    );
};
export default observer(SummaryPriceDetails);

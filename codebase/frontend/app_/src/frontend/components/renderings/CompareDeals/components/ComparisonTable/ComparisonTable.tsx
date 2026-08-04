import React, { FC, useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getActualPrice } from 'frontend/utils/livePrice.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { CompareOption, IComparisonTableFields } from 'models/data/IComparison';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import Button from 'frontend/components/common/Button';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import SVGCross from 'frontend/components/icons-new/Cross';
import { IOfferWithActionFields } from 'frontend/components/renderings/CompareDeals/stores/CompareStore';
import { useCompareStore } from 'frontend/components/renderings/CompareDeals/stores/createCompareLocalStore';
import OfferCardPriceItem from 'frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPriceItem';

import CompareOfferButton from './components/CompareOfferButton/CompareOfferButton';
import DynamicCell from './components/DynamicCell/DynamicCell';

import styles from './ComparisonTable.module.scss';

const ComparisonTable: FC<IComparisonTableFields> = ({ ComparisonCriteria, FallbackLabel }) => {
    const { getSetting } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const { updateComparisonList, closeCompareOverlay, comparisonList, hasMinItemsToCompare } = useCompareStore();

    useEffect(() => {
        if (!hasMinItemsToCompare) {
            closeCompareOverlay();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasMinItemsToCompare]);

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    const removeOfferFromComparison = (offer: IOfferWithActionFields): void => {
        updateComparisonList(offer);
    };

    return (
        <div className={styles.wrapper}>
            <table className={styles.table}>
                <tbody>
                    <tr className={styles.hotelNameRow}>
                        <th />
                        {comparisonList.map((offer, index) => (
                            <td key={`${index}_${offer.hotel?.name}`} className={styles.hotelNameCell}>
                                <div className={styles.title}>
                                    <span data-tid='hotel-name'>{offer.hotel?.name}</span>

                                    <Button
                                        isText
                                        onClick={() => {
                                            removeOfferFromComparison(offer);
                                        }}
                                        className={styles.removeButton}
                                        dataTid='remove-hotel'
                                    >
                                        <SVGCross />
                                    </Button>
                                </div>
                            </td>
                        ))}
                    </tr>

                    <tr>
                        <th />
                        {comparisonList.map((offer, index) => {
                            const { price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax } =
                                getActualPrice(offer.livePrice, offer);

                            return (
                                <td key={`${index}_${offer.pricePP}`} className={styles.priceCell}>
                                    {pricePPExcludingTouristTax ? (
                                        <OfferCardPriceItem
                                            price={price}
                                            pricePP={pricePP}
                                            priceExcludingTouristTax={priceExcludingTouristTax}
                                            pricePPExcludingTouristTax={pricePPExcludingTouristTax}
                                            currency={offer.currency?.code}
                                            priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                                            className={styles.price}
                                            isPricePP
                                            taxTooltipTriggerClassName={styles.taxTooltipTrigger}
                                            {...getTouristTaxFieldsFromOffer(offer)}
                                        />
                                    ) : (
                                        <Text field={FallbackLabel} />
                                    )}
                                </td>
                            );
                        })}
                    </tr>

                    <tr>
                        <th />
                        {comparisonList.map((offer, index) => (
                            <td
                                key={`${index}_${offer.hotel?.images[0].small}`}
                                className={styles.image}
                                data-tid='compare-hotel-image'
                            >
                                <HotelImage
                                    image={{
                                        ...offer.hotel?.images[0],
                                        small: offer.hotel?.images[0].small ?? '',
                                        medium: offer.hotel?.images[0].medium ?? '',
                                        large: offer.hotel?.images[0].large ?? '',
                                    }}
                                    fallbackImage={fallbackImage}
                                    className={styles.image}
                                />
                            </td>
                        ))}
                    </tr>

                    {ComparisonCriteria.map(option => (
                        <tr key={option.id} className={styles.dynamicRow}>
                            <th className={styles.firstItem} data-tid={option.fields.Type.value}>
                                {option.fields.Name.value}
                            </th>
                            {comparisonList.map((offer, index) => (
                                <td
                                    key={`${offer.id}_${option.id}_${index}`}
                                    data-tid={`${option.fields.Type.value}_value`}
                                >
                                    {
                                        <DynamicCell
                                            offer={offer}
                                            option={option.fields.Type.value as CompareOption}
                                            MissingDataLabel={option.fields.MissingDataLabel}
                                            FallbackLabel={FallbackLabel}
                                        />
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}

                    <tr>
                        <th />

                        {comparisonList.map((offer, index) => (
                            <td key={`${offer.id}_${index}`}>
                                <div className={styles.buttonWrapper}>
                                    <CompareOfferButton offer={offer} />
                                </div>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ComparisonTable;

import React, { FC, MouseEvent, useEffect, useMemo, useState } from 'react';

import { Tokens } from 'code/tokens';
import useHolidaysDestinationPageTypeName from 'frontend/hooks/useHolidaysDestinationPageTypeName';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDurationLabel } from 'frontend/utils/accommodation.utils';
import { getCheapestLivePrice } from 'frontend/utils/livePrice.utils';
import { getRelatedDestinationsCodes } from 'frontend/utils/search/search.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { formatMoneyWithTouristTax } from 'frontend/utils/touristTax.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { IDestinationFields } from 'models/data/IDestinationFields';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import styles from './ViewHolidaysResults.module.scss';

export const VIEW_HOLIDAYS_RESULTS_CTA_ID = 'view-holidays-results-cta';

interface IViewHolidaysResultsFields {
    EnglishTracking: ISitecoreField<string>;
    LinkName: ISitecoreField<string>;
    Text: ISitecoreField<string>;
    Regions?: ISitecoreCompositeField<IDestinationFields>[];
}

export interface IViewHolidaysResultsProps {
    fields: IViewHolidaysResultsFields;
}

export const ViewHolidaysResults: FC<IViewHolidaysResultsProps> = ({ fields }) => {
    const {
        destination,
        destinationInEng,
        destinationCode,
        getLivePrice,
        getPhrase,
        buildSearchQueryByLivePrice,
        sitePath,
        searchResultsUrl,
        setSearchValuesByQueryString,
        formatMoney,
        isViewHolidaysResultsLivePriceEnabled,
        trackEventWithParams,
        getSettingAsNumber,
        isTouristTaxEnabled,
        isVirtualResortBrowsePage,
        isVirtualRegionBrowsePage,
        pageFields,
    } = useStore((stores: TStores) => ({
        destination: stores.layoutStore.route?.fields?.Name.value,
        destinationInEng: stores.layoutStore.layoutName,
        destinationCode: stores.layoutStore.destinationCode,
        getLivePrice: stores.hotelsStore.getLivePrice,
        getPhrase: stores.layoutStore.getPhrase,
        buildSearchQueryByLivePrice: stores.queryParamStore.buildSearchQueryByLivePrice,
        sitePath: stores.layoutStore.sitePath,
        searchResultsUrl: stores.routerStore.searchResultsUrl,
        setSearchValuesByQueryString: stores.bookingStore.setSearchValuesByQueryString,
        formatMoney: stores.marketStore.formatMoney,
        isViewHolidaysResultsLivePriceEnabled: stores.layoutStore.isViewHolidaysResultsLivePriceEnabled,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        isVirtualResortBrowsePage: stores.layoutStore.isVirtualResortBrowsePage,
        isVirtualRegionBrowsePage: stores.layoutStore.isVirtualRegionBrowsePage,
        pageFields: stores.layoutStore.pageFields,
    }));

    const { Text, LinkName } = fields || {};
    const [prices, setPrices] = useState<ILivePrice[]>([]);

    const relatedRegionsCodes = getRelatedDestinationsCodes(
        pageFields,
        isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage,
    );

    const cheapestLivePrice = useMemo((): Nullable<ILivePrice> => getCheapestLivePrice(prices), [prices]);

    const loadPrices = async () => {
        const codes = relatedRegionsCodes.length ? relatedRegionsCodes : [destinationCode];
        const prices = await getLivePrice(codes);

        setPrices(prices);
    };

    const holidaysDestinationPageTypeName = useHolidaysDestinationPageTypeName();

    useEffect(() => {
        if (destinationCode && isViewHolidaysResultsLivePriceEnabled) {
            loadPrices();
        }

        return () => {
            setPrices([]);
        };
    }, [destinationCode]);

    const pricePP = cheapestLivePrice?.pricePP ?? 0;
    const pricePPExcludingTouristTax = cheapestLivePrice?.pricePPExcludingTouristTax ?? 0;
    const isPriceValid = isTouristTaxEnabled ? !!pricePP : !!pricePPExcludingTouristTax;
    const nights = cheapestLivePrice?.searchCriteria.duration;
    const totalNights = getDurationLabel(getPhrase, nights);

    const textValue = Tokenizer.replaceTokens(fields?.Text?.value, {
        [Tokens.Nights]: `<strong class=${styles.description}>${totalNights}</strong>` || '',
        [Tokens.Country]: destination || '',
    });

    const linkValue = Tokenizer.replaceTokens(fields?.LinkName?.value, {
        [Tokens.Country]: destination || '',
    });

    const renderPriceLabel = (block: React.ReactNode): React.ReactElement => (
        <TouristTaxGenericTooltip>{block}</TouristTaxGenericTooltip>
    );

    const renderLink = () => {
        if (!LinkName) {
            return null;
        }

        const flexDays = getSettingAsNumber(SiteSettings.NumberOfFlexibleDays);
        const query = buildSearchQueryByLivePrice(
            cheapestLivePrice!,
            false,
            flexDays,
            undefined,
            destinationCode,
            undefined,
        );
        const url = searchResultsUrl(query);

        const onLinkClick = (e: MouseEvent) => {
            if (holidaysDestinationPageTypeName) {
                let positionNumber;
                const englishTrackingValue = Tokenizer.replaceTokens(fields.EnglishTracking?.value, {
                    [Tokens.Country]: destinationInEng || '',
                });
                const viewHolidaysButtons = document.querySelectorAll(`a[data-tid='${VIEW_HOLIDAYS_RESULTS_CTA_ID}']`);

                viewHolidaysButtons.forEach((el, i) => {
                    if ((el as HTMLElement).offsetTop === (e.target as HTMLElement).offsetTop) {
                        positionNumber = i + 1;
                    }
                });

                const customParams = generateGenericValues({
                    genericValue1: holidaysDestinationPageTypeName,
                    genericValue3: `${positionNumber}`,
                    destinationUrl: `${sitePath}${url}`,
                });

                trackEventWithParams(
                    EventTypes.GenericEvent,
                    {
                        eventAction: EventActions.ButtonClick,
                        eventCategory: EventCategories.DestinationGuide,
                        eventLabel: englishTrackingValue ?? undefined,
                        eventType: EventTypes.Interaction,
                    },
                    customParams,
                );
            }

            setSearchValuesByQueryString(query);
        };

        return (
            <RouterLink
                link={{ value: { href: url } }}
                className={`btn ${styles.button}`}
                onClick={onLinkClick}
                dataId={VIEW_HOLIDAYS_RESULTS_CTA_ID}
            >
                {linkValue}
            </RouterLink>
        );
    };

    if (!fields || !pricePP || !nights || !isViewHolidaysResultsLivePriceEnabled) {
        return null;
    }

    const livePriceLabel = formatMoneyWithTouristTax(
        pricePP,
        pricePPExcludingTouristTax,
        isTouristTaxEnabled,
        formatMoney,
        {
            currency: cheapestLivePrice.currency,
            maximumFractionDigits: 0,
        },
    );

    return (
        <div className={styles.viewHolidaysContainer}>
            <div className={styles.textWrapper} data-tid='view-holidays-results-text'>
                {Text?.value && (
                    <RichTextWithLinks
                        className={styles.description}
                        data-tid='cta-description'
                        field={{
                            ...Text,
                            value: textValue,
                        }}
                    />
                )}
                {isPriceValid && (
                    <PriceLabel
                        tag='strong'
                        className={styles.description}
                        wrapPrice={renderPriceLabel}
                        price={livePriceLabel}
                        priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPerson}
                    />
                )}
            </div>
            {renderLink()}
        </div>
    );
};

export default ViewHolidaysResults;

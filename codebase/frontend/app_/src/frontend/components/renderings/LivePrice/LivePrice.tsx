import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useHolidaysDestinationPageTypeName from 'frontend/hooks/useHolidaysDestinationPageTypeName';
import useStore from 'frontend/hooks/useStore';
import offersService from 'frontend/services/offers.service';
import { TStores } from 'frontend/store/IStores';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { getSearchQueryParamsByPrice } from 'frontend/utils/livePrice.utils';
import { formatMoneyWithTouristTax } from 'frontend/utils/touristTax.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import Link from 'frontend/components/common/Link';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import styles from './LivePrice.module.scss';

export interface ILivePriceProps {
    livePrice: Nullable<ILivePrice>;
    availableOriginsSearchEnabled?: boolean;
    destinationRelatedCodes?: string[];
    destinationVirtualCode?: string;
    hasChevronIcon?: boolean;
    hasGenericTaxTooltip?: boolean;
    isFlexibleSearch?: boolean;
    isHolidaysResultButtonEnabled?: boolean;
    isLink?: boolean;
    isNumberOfNightsLabelsEnabled?: boolean;
}

export const LivePrice: FC<ILivePriceProps> = ({
    livePrice,
    availableOriginsSearchEnabled,
    destinationRelatedCodes,
    destinationVirtualCode,
    hasChevronIcon,
    isFlexibleSearch,
    isHolidaysResultButtonEnabled,
    isLink,
    isNumberOfNightsLabelsEnabled,
    hasGenericTaxTooltip,
}) => {
    const {
        getPhrase,
        searchResultsUrl,
        buildSearchQueryByLivePrice,
        setSearchValuesByQueryString,
        formatMoney,
        trackEventWithParams,
        sitePath,
        getFlexDays,
        isTouristTaxEnabled,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        searchResultsUrl: stores.routerStore.searchResultsUrl,
        buildSearchQueryByLivePrice: stores.queryParamStore.buildSearchQueryByLivePrice,
        setSearchValuesByQueryString: stores.bookingStore.setSearchValuesByQueryString,
        formatMoney: stores.marketStore.formatMoney,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        sitePath: stores.layoutStore.sitePath,
        getFlexDays: stores.layoutStore.getFlexDays,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));
    const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);
    const [isAvailableOriginsLoaded, setIsAvailableOriginsLoaded] = useState(false);
    const flexDays = getFlexDays(isFlexibleSearch);

    const getAvailableOrigins = async () => {
        if (!livePrice) return;

        const { geog, startDate, endDate } = getSearchQueryParamsByPrice(livePrice);

        try {
            const result = await offersService.getAvailableOrigins(
                    destinationRelatedCodes?.join(',') || geog,
                    formatDateToQuery(startDate),
                    formatDateToQuery(endDate),
                    flexDays,
                ),
                availableOrigins = result.data;

            setAvailableOrigins(availableOrigins);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAvailableOriginsLoaded(true);
        }
    };

    const holidaysDestinationPageTypeName = useHolidaysDestinationPageTypeName();

    const renderLivePrice = (block: React.ReactElement): React.ReactElement =>
        hasGenericTaxTooltip ? <TouristTaxGenericTooltip>{block}</TouristTaxGenericTooltip> : block;

    const renderLivePricePrefix = (label: string): React.ReactElement => (
        <span className='live-price__prefix'>{label}</span>
    );

    const renderLivePriceSuffix = (label: string): React.ReactElement => (
        <span className='live-price__suffix'>{label}</span>
    );

    useEffect(() => {
        if (availableOriginsSearchEnabled && (isLink || isHolidaysResultButtonEnabled)) {
            getAvailableOrigins();
        }
    }, [livePrice]);

    const renderPriceLabel = (): React.ReactElement | null => {
        if (!livePrice) return null;

        const livePriceWithTouristTaxLabel = formatMoneyWithTouristTax(
            livePrice.pricePP,
            livePrice.pricePPExcludingTouristTax ?? 0,
            isTouristTaxEnabled,
            formatMoney,
            {
                currency: livePrice.currency,
                maximumFractionDigits: 0,
            },
        );

        return (
            <PriceLabel
                price={<span className='live-price__amount'>{livePriceWithTouristTaxLabel}</span>}
                priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                wrapPrice={renderLivePrice}
                wrapLabelBeforePrice={renderLivePricePrefix}
                wrapLabelAfterPrice={renderLivePriceSuffix}
                chevronIcon={hasChevronIcon ? <SvgChevronRight className='live-price__chevron-icon' /> : undefined}
            />
        );
    };

    const renderContent = (): React.ReactElement | null => {
        const isRenderContentEnabled = isHolidaysResultButtonEnabled || isNumberOfNightsLabelsEnabled;

        if (!livePrice || !isRenderContentEnabled) return null;

        return (
            <span className='live-price__nights'>
                {livePrice?.searchCriteria.duration}
                <span className='live-price__nights-duration-phrase'>
                    {livePrice?.searchCriteria.duration === 1
                        ? getPhrase(SitecoreDictionary.GlobalsLabelsNightSingular)
                        : getPhrase(SitecoreDictionary.GlobalsLabelsNightsPlural)}
                </span>
            </span>
        );
    };

    const renderLink = (): React.ReactElement | null => {
        if (availableOriginsSearchEnabled && !isAvailableOriginsLoaded) {
            return null;
        }

        const query = buildSearchQueryByLivePrice(
            livePrice!,
            false,
            flexDays,
            availableOrigins,
            destinationVirtualCode,
            destinationRelatedCodes,
        );

        const url = searchResultsUrl(query);

        const onLinkClick = (): void => {
            if (isHolidaysResultButtonEnabled && holidaysDestinationPageTypeName) {
                const customParams = generateGenericValues({
                    genericValue1: holidaysDestinationPageTypeName,
                    destinationUrl: `${sitePath}${url}`,
                });
                trackEventWithParams(
                    EventTypes.GenericEvent,
                    {
                        eventAction: EventActions.HeroBannerButtonClick,
                        eventCategory: EventCategories.DestinationGuide,
                        eventLabel: 'View Holidays',
                        eventType: EventTypes.Interaction,
                    },
                    customParams,
                );
            }

            setSearchValuesByQueryString(query);
        };

        return (
            <>
                {isHolidaysResultButtonEnabled ? (
                    <>
                        <Link
                            href={url}
                            className='btn btn--large'
                            onClick={onLinkClick}
                            data-tid='live-price-holiday-result-button'
                        >
                            {getPhrase(SitecoreDictionary.DestinationsLabelsViewHolidays)}
                        </Link>
                        <div className={classNames(styles.content, 'live-price__content')}>
                            {renderContent()}
                            {renderPriceLabel()}
                        </div>
                    </>
                ) : (
                    <div className={classNames(styles.content, 'live-price__content live-price')}>
                        <Link href={url} onClick={onLinkClick}>
                            {renderContent()}
                        </Link>
                        {renderPriceLabel()}
                    </div>
                )}
            </>
        );
    };

    if (!livePrice?.pricePP) {
        return null;
    }

    return isLink || isHolidaysResultButtonEnabled ? (
        renderLink()
    ) : (
        <span className={classNames(styles.content, 'live-price__content live-price')}>
            {renderContent()}
            {renderPriceLabel()}
        </span>
    );
};

export default observer(LivePrice);

import * as React from 'react';
import { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { addDays, formatDateL10n, parseDateL10n } from 'frontend/utils/date.utils';
import { getExtraLuggageFromLivePriceAndOffer } from 'frontend/utils/luggage.utils';
import { containsLuxuryPromoCode, getAvailabilityFromOffer } from 'frontend/utils/offer.utils';
import { isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { getTransferFromLivePriceAndOffer } from 'frontend/utils/transfer.utils';
import { getRoomsUrgencyMessageVisibility } from 'frontend/utils/urgencyMessage.utils';
import { buildAltIdsFromAltAccommodationsParams } from 'frontend/utils/url.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { MarketCode } from 'models/data/MarketSettings';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { QueryParamName } from 'models/enum/QueryParamName';
import { ShortlistType } from 'models/enum/ShortlistType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import PackageIcons from 'frontend/components/common/PackageIcons/PackageIcons';
import UrgencyMessage from 'frontend/components/common/UrgencyMessage/UrgencyMessage';
import { useUrgencyMessageText } from 'frontend/components/common/UrgencyMessage/UrgencyMessage.hooks';
import useOptimizelyExperiment from 'frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment';
import { experimentConfigs } from 'frontend/components/cro/UrgencyMessageV2EuxAB/testConfig';
import { IComponentWithRerenderProps, withRerender } from 'frontend/components/hoc/withRerender';
import ImageCarouselContainer from 'frontend/components/renderings/SearchResults/components/ImageCarouselContainer/ImageCarouselContainer';
import OfferCardHotelHead from 'frontend/components/renderings/SearchResults/components/OfferCardHotelHead';
import OfferCardOptions from 'frontend/components/renderings/SearchResults/components/OfferCardOptions';
import OfferPrice from 'frontend/components/renderings/SearchResults/components/OfferPrice/OfferPrice';
import { IShortlistsSitecoreFields } from 'frontend/components/renderings/Shortlists/interfaces';

import styles from './offerCard.module.scss';

interface IPropsForEditModeOnShortlistPage {
    isSelectedToEdit?: boolean;
    isSelectionEditMode?: boolean;
    onToggleEditSelection?: (offer: IOffer) => void;
}

export interface IOfferCardProps extends IComponentWithRerenderProps, IPropsForEditModeOnShortlistPage {
    fallbackImage: string;
    offer: IOffer;
    offerIndex: number;
    onSelect: (offer: IOffer) => void;
    rendering: any;
    ShortlistFields?: IShortlistsSitecoreFields;
    alternativeFlightsDefaultSort?: AlternativeFlightsSortBy;
    alternativeFlightsSortOrders?: ISelectOption[];
    cardRef?: React.RefObject<HTMLDivElement>;
    hasShortlistBookmark?: boolean;
    isSelectedToCompare?: boolean;
    livePrice?: Nullable<ILivePrice>;
    origins?: string[];
}

const OfferCard: FC<IOfferCardProps> = ({
    isSelectedToEdit,
    cardRef,
    offer,
    fallbackImage,
    offerIndex,
    isSelectionEditMode,
    hasShortlistBookmark,
    rendering,
    onSelect,
    onToggleEditSelection,
    livePrice,
    origins,
    wasRerendered,
    alternativeFlightsDefaultSort,
    alternativeFlightsSortOrders,
    isSelectedToCompare,
    ShortlistFields,
}) => {
    const experimentAB = useOptimizelyExperiment(experimentConfigs);

    const {
        buildHotelDetailsQuery,
        hotelDetailsUrl,
        currentPath,
        isShortlistPage,
        isSearchResultsPage,
        isPromoPage,
        buildBD4HotelParams,
        hotelsBefore,
        isScreenLessMedium,
        marketCode,
        getSettingAsNumber,
        getShortlistHotelLink,
        isOfferFromAnotherMarket,
        getPhrase,
    } = useStore((stores: TStores) => ({
        hotelDetailsUrl: stores.routerStore.hotelDetailsUrl,
        isShortlistPage: stores.layoutStore.isShortlistPage,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        isPromoPage: stores.layoutStore.isPromoPage,
        marketCode: stores.marketStore.marketCode,
        currentPath: stores.layoutStore.currentPath,
        buildHotelDetailsQuery: stores.queryParamStore.buildHotelDetailsQuery,
        buildBD4HotelParams: stores.queryParamStore.buildBD4HotelParam,
        hotelsBefore: (stores.searchStore.page - 1) * (stores.searchStore.take || 0),
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
        ...(isHolidayStore(stores) && {
            getShortlistHotelLink: stores.shortlistStore.getShortlistHotelLink,
        }),
        isOfferFromAnotherMarket: isHolidayStore(stores)
            ? stores.shortlistStore.isOfferFromAnotherMarket
            : (): boolean => false,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const avail = getAvailabilityFromOffer(offer);
    const { urgencyMessageText, urgencyMessageTooltipText } = useUrgencyMessageText({ avail: avail });

    const onClickSelect = (): void => {
        onSelect(offer);
    };

    const onChangeEditSelection = (): void => onToggleEditSelection?.(offer);

    const getBd4AnalyticsParams = (): Nullable<Partial<Record<QueryParamName, string>>> => {
        const position = hotelsBefore + offerIndex + 1;

        return buildBD4HotelParams(position, QueryParamName.EjSort);
    };

    const isOfferUnavailableInShortlist = isShortlistOfferUnavailable(offer);

    const isShortlistHotelType = offer.shortlist?.type === ShortlistType.Hotel;

    const getHotelLink = (): string => {
        if (isShortlistPage) {
            return getShortlistHotelLink?.(offer) || '';
        }

        const transfer = offer.transfers?.length > 0 ? offer.transfers[0].code : '';
        const startDate = parseDateL10n(offer.date, DATE_FORMATS.query) as Date;
        const endDate = addDays(offer.stay, startDate);

        /** Add offer detail to the url params. */
        const additionalParams = {
            [QueryParamName.Transfer]: transfer,
            [QueryParamName.DefaultTransfer]: transfer,
        };

        // will be used only if we can't get from/to from other sources
        const fallbackParams = {
            [QueryParamName.From]: formatDateL10n(startDate),
            [QueryParamName.To]: formatDateL10n(endDate),
        };

        // for search results page use from/to params from searchStore, not from offer itself for correct work of back button (https://jira.build.easyjet.com/browse/EJH-16021)
        if (!isSearchResultsPage) {
            additionalParams[QueryParamName.From] = formatDateL10n(startDate);
            additionalParams[QueryParamName.To] = formatDateL10n(endDate);
        }

        if (isPromoPage) {
            additionalParams[QueryParamName.Promo] = currentPath || '';

            if (!origins?.length) {
                additionalParams[QueryParamName.Origin] = [offer.transport.routes[0].depPt];
            }
        }

        if (offer.altAcc?.length) {
            const [altAccommodationIds, altPackageIds] = buildAltIdsFromAltAccommodationsParams(offer.altAcc);

            additionalParams[QueryParamName.AltAccommodationIds] = altAccommodationIds;
            additionalParams[QueryParamName.AltPackageIds] = altPackageIds;
        }

        const query = buildHotelDetailsQuery(
            offer,
            { ...additionalParams, ...getBd4AnalyticsParams() },
            { ...fallbackParams },
        );

        return hotelDetailsUrl(offer.hotel, query) || '';
    };

    const hotelLink = getHotelLink();
    const { isSponsored, hotel, accom } = offer;
    const routeDep = offer.transport.routes[0];
    const routeArr = offer.transport.routes[1];

    const isABVariantTest =
        experimentAB?.activeVariantId && experimentAB.config?.variantA === experimentAB.activeVariantId;
    const isUKMarket = marketCode === MarketCode.UK;
    const isUrgencyMessageVisible = getRoomsUrgencyMessageVisibility(getSettingAsNumber, avail);

    const isFromAnotherMarket = isShortlistPage && isOfferFromAnotherMarket(offer);
    const isLuxury = containsLuxuryPromoCode(offer.promoCollections ?? offer.hotel?.promoCollections);
    const isSelected = isSelectedToEdit || isSelectedToCompare;

    return (
        <div
            className={classNames('card', styles.card, {
                'card--selected': !isLuxury && isSelected,
                sponsored: isSponsored,
            })}
            ref={cardRef}
            data-source={accom.isExt ? 'external' : 'contract'}
        >
            <LuxuryWrapper
                label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}
                renderChildrenOnly={!isLuxury}
                wrapperClassName={classNames(styles.luxuryWrapper, styles.priority, {
                    [styles.selected]: isLuxury && isSelected,
                })}
                contentClassName={styles.luxuryContentWrapper}
            >
                <div className='hotel-card hotel-card-v2 row'>
                    <div className='hotel-card-img-box-wr col-lg-5'>
                        <ImageCarouselContainer fallbackImage={fallbackImage} offer={offer} />
                    </div>

                    <div className='hotel-card-text-box col-lg-7'>
                        <div className='row'>
                            <div className='col-lg-8 hotel-card-info-column-v2'>
                                <OfferCardHotelHead
                                    hotelLink={hotelLink}
                                    onClickSelect={onClickSelect}
                                    hasShortlistBookmark={hasShortlistBookmark}
                                    isSelectionEditMode={isSelectionEditMode}
                                    isSelectedToEdit={isSelectedToEdit}
                                    onChangeEditSelection={onChangeEditSelection}
                                    offer={offer}
                                />
                                <div className='hotel-card-txt hotel-card-txt-v2'>
                                    <div
                                        className={classNames(
                                            'hotel-card-options-v2',
                                            isShortlistHotelType && 'flex-column',
                                        )}
                                    >
                                        <OfferCardOptions
                                            holidayTheme={offer.accom?.theme || hotel?.theme}
                                            holidayType={hotel?.hotelType}
                                            closestFacility={hotel?.closestFacility}
                                            roomType={offer.accom?.unit?.[0]?.roomType}
                                            boardType={offer.accom?.unit?.[0]?.boardType}
                                            night={offer.stay || offer.accom?.stay}
                                            routeDep={routeDep}
                                            routeArr={routeArr}
                                            offer={offer}
                                            alternativeFlightsSortOrders={alternativeFlightsSortOrders}
                                            alternativeFlightsDefaultSort={alternativeFlightsDefaultSort}
                                            isABVariantTest={isABVariantTest}
                                            isUrgencyMessageVisible={isUrgencyMessageVisible}
                                            isShortlistPage={isShortlistPage}
                                            isShortlistHotelType={isShortlistHotelType}
                                        />
                                    </div>
                                </div>

                                {/*EHD-538: Urgency Message Wrapper need to improve analytics for Optimazely experiment, this wrapper will removed when the AB experiment ends*/}
                                {wasRerendered && isScreenLessMedium && isUrgencyMessageVisible && (
                                    <span className={styles.urgencyMessageWrapper}>
                                        {(isUKMarket || isABVariantTest) && (
                                            <UrgencyMessage
                                                className={styles.urgencyMessage}
                                                message={urgencyMessageText}
                                                tooltip={urgencyMessageTooltipText}
                                            />
                                        )}
                                    </span>
                                )}

                                <PackageIcons
                                    packageIcons={offer.accom?.theme?.packageIcons || hotel?.theme?.packageIcons || []}
                                    transfer={
                                        isFromAnotherMarket ? null : getTransferFromLivePriceAndOffer(livePrice, offer)
                                    }
                                    extraLuggage={
                                        isFromAnotherMarket
                                            ? undefined
                                            : getExtraLuggageFromLivePriceAndOffer(livePrice, offer)
                                    }
                                    isLuxury={isLuxury}
                                    className={styles.packageIcons}
                                    rendering={rendering}
                                />
                            </div>
                            <div className='hotel-card-body col-lg-4'>
                                <div className='hotel-card-price-box-v2'>
                                    {!isOfferUnavailableInShortlist && (
                                        <Placeholder
                                            name={PlaceholderNames.PromotionalMessages}
                                            rendering={rendering}
                                            routeDep={routeDep}
                                            offer={offer}
                                        />
                                    )}

                                    <OfferPrice
                                        livePrice={livePrice}
                                        link={hotelLink}
                                        onClickViewHoliday={onClickSelect}
                                        offer={offer}
                                        isShortlistHotelType={isShortlistHotelType}
                                        isLuxury={isLuxury}
                                        ShortlistFields={ShortlistFields}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LuxuryWrapper>
        </div>
    );
};

export default observer(withRerender(OfferCard));

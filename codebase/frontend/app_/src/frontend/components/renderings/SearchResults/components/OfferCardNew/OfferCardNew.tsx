import React, { FC, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { addDays, formatDateL10n, parseDateL10n } from 'frontend/utils/date.utils';
import { getHotelLinkWithPrice } from 'frontend/utils/hotelLink.utils';
import { containsLuxuryPromoCode, getAvailabilityFromOffer } from 'frontend/utils/offer.utils';
import { isShortlistOfferUnavailable as getIsShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { getRoomsUrgencyMessageVisibility } from 'frontend/utils/urgencyMessage.utils';
import { buildAltIdsFromAltAccommodationsParams } from 'frontend/utils/url.utils';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IOffer } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { QueryParamName } from 'models/enum/QueryParamName';
import { ShortlistType } from 'models/enum/ShortlistType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import UrgencyMessage from 'frontend/components/common/UrgencyMessage/UrgencyMessage';
import { useUrgencyMessageText } from 'frontend/components/common/UrgencyMessage/UrgencyMessage.hooks';
import { IComponentWithRerenderProps, withRerender } from 'frontend/components/hoc/withRerender';
import AmendHotelOfferCardFooter, {
    IHotelOfferCardFields,
} from 'frontend/components/renderings/AmendHotel/components/AmendHotelOfferCardFooter/AmendHotelOfferCardFooter';
import OfferExtras from 'frontend/components/renderings/AmendHotel/components/OfferExtras/OfferExtras';
import { useCompareStore } from 'frontend/components/renderings/CompareDeals/stores/createCompareLocalStore';
import ImageCarouselContainer from 'frontend/components/renderings/SearchResults/components/ImageCarouselContainer/ImageCarouselContainer';
import OfferCardOptions from 'frontend/components/renderings/SearchResults/components/OfferCardOptions';
import cardOptionsStyles from 'frontend/components/renderings/SearchResults/components/OfferCardOptions.module.scss';

import OfferCardFooter from './components/OfferCardFooter/OfferCardFooter';
import OfferCardHeader from './components/OfferCardHeader/OfferCardHeader';

import styles from './OfferCardNew.module.scss';

interface IPropsForEditModeOnShortlistPage {
    isSelectedToEdit?: boolean;
    isSelectionEditMode?: boolean;
}

export interface IOfferCardProps extends IComponentWithRerenderProps, IPropsForEditModeOnShortlistPage {
    fallbackImage: string;
    offer: IOffer;
    offerIndex: number;
    onSelect: (offer: IOffer) => void;
    rendering: ISitecoreComponent['rendering'];
    alternativeFlightsDefaultSort?: AlternativeFlightsSortBy;
    alternativeFlightsSortOrders?: ISelectOption[];
    amendHotelOffer?: IAmendHotelOffer;
    cardRef?: React.RefObject<HTMLDivElement>;
    hasShortlistBookmark?: boolean;
    hotelOfferCardFields?: IHotelOfferCardFields;
    isInAmendHotelFlow?: boolean;
    origins?: string[];
}

const OfferCard: FC<IOfferCardProps> = ({
    isSelectedToEdit,
    cardRef,
    offer,
    amendHotelOffer = {} as IAmendHotelOffer,
    fallbackImage,
    offerIndex,
    isSelectionEditMode,
    hasShortlistBookmark,
    rendering,
    onSelect,
    origins,
    alternativeFlightsSortOrders,
    alternativeFlightsDefaultSort,
    isInAmendHotelFlow = false,
    hotelOfferCardFields,
}) => {
    const {
        buildHotelDetailsQuery,
        hotelDetailsUrl,
        currentPath,
        isShortlistPage,
        isSearchResultsPage,
        isPromoPage,
        buildBD4HotelParams,
        hotelsBefore,
        getSettingAsNumber,
        getShortlistHotelLink,
        isFullScreenEnabled,
        isFullScreenEnabledPromoPage,
        getPhrase,
    } = useStore((stores: TStores) => ({
        hotelDetailsUrl: stores.routerStore.hotelDetailsUrl,
        isShortlistPage: stores.layoutStore.isShortlistPage,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        isPromoPage: stores.layoutStore.isPromoPage,
        currentPath: stores.layoutStore.currentPath,
        buildHotelDetailsQuery: stores.queryParamStore.buildHotelDetailsQuery,
        buildBD4HotelParams: stores.queryParamStore.buildBD4HotelParam,
        hotelsBefore: (stores.searchStore.page - 1) * (stores.searchStore.take || 0),
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
        ...(isHolidayStore(stores) && {
            getShortlistHotelLink: stores.shortlistStore.getShortlistHotelLink,
        }),
        isFullScreenEnabled: stores.layoutStore.isFullScreenEnabledSearchResults,
        isFullScreenEnabledPromoPage: stores.layoutStore.isFullScreenEnabledPromo,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { isOfferSelectedToCompare } = useCompareStore() || {};

    const isMobileView = useMobileViewport();
    const isShortlistOfferUnavailable = useMemo(() => getIsShortlistOfferUnavailable(offer), [offer]);
    const avail = getAvailabilityFromOffer(offer);
    const isUrgencyMessageVisible = getRoomsUrgencyMessageVisibility(getSettingAsNumber, avail);
    const isUrgencyMessageVisibleOnBottom = isUrgencyMessageVisible && !isInAmendHotelFlow && isMobileView;
    const { urgencyMessageText, urgencyMessageTooltipText } = useUrgencyMessageText({ avail });

    const onClickSelect = (): void => {
        onSelect(offer);
    };

    const getBd4AnalyticsParams = (): Nullable<Partial<Record<QueryParamName, string>>> => {
        // check if it can be simplified
        const position = hotelsBefore + offerIndex + 1;

        return buildBD4HotelParams(position, QueryParamName.EjSort);
    };

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
    const hotelLinkWithPrice = getHotelLinkWithPrice(offer, hotelLink);

    const { hotel, accom } = offer;
    const routeDep = offer.transport.routes[0];
    const routeArr = offer.transport.routes[1];
    const isLuxury = containsLuxuryPromoCode(offer.promoCollections);
    const isOfferHighlighted = isOfferSelectedToCompare?.(offer) || false;

    return (
        <div
            className={classNames(styles.cardWrapper, {
                [styles.luxury]: isLuxury,
                'card--selected': isSelectedToEdit || isOfferHighlighted,
            })}
            ref={cardRef}
            data-source={accom.isExt ? 'external' : 'contract'}
            data-tid='offer-card'
        >
            <LuxuryWrapper
                contentClassName={classNames(styles.luxuryContent, styles.priority)}
                wrapperClassName={styles.luxuryWrapper}
                bannerClassName={styles.luxuryBanner}
                label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}
                renderChildrenOnly={!isLuxury}
            >
                <div className={classNames('hotel-card-v2', styles.card)}>
                    <div className={classNames('hotel-card row', styles.topWrapper)}>
                        <div className='hotel-card-img-box-wr col-xl-5'>
                            <ImageCarouselContainer
                                fallbackImage={fallbackImage}
                                offer={offer}
                                isFullScreenEnabled={isPromoPage ? isFullScreenEnabledPromoPage : isFullScreenEnabled}
                            />
                        </div>

                        <div className='hotel-card-text-box col-xl-7'>
                            <div className='hotel-card-info-column-v2'>
                                <OfferCardHeader
                                    hotelLink={hotelLink}
                                    hotelLinkWithPrice={hotelLinkWithPrice}
                                    isShortlistButton={!!hasShortlistBookmark && !isSelectionEditMode}
                                    onClickSelect={onClickSelect}
                                    offer={offer}
                                    routeDep={routeDep}
                                    rendering={rendering}
                                    isOfferUnavailableInShortlist={isShortlistOfferUnavailable}
                                    isInAmendHotelFlow={isInAmendHotelFlow}
                                    onClickViewHoliday={onClickSelect}
                                />
                                <div className='hotel-card-txt hotel-card-txt-v2'>
                                    <div
                                        className={classNames(
                                            'hotel-card-options-v2',
                                            isShortlistHotelType && 'flex-column',
                                        )}
                                    >
                                        {isInAmendHotelFlow ? (
                                            <OfferExtras
                                                boardType={offer.accom.unit[0].boardType}
                                                roomType={offer.accom.unit[0].roomType}
                                                transfer={offer.transfers[0]}
                                                ecoFacility={hotel?.ecoFacility}
                                                isUrgencyMessageVisible={isUrgencyMessageVisible}
                                                avail={avail}
                                            />
                                        ) : (
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
                                                isShortlistPage={isShortlistPage}
                                                isShortlistHotelType={isShortlistHotelType}
                                                isOfferCardsABTesting={true}
                                                alternativeFlightsSortOrders={alternativeFlightsSortOrders}
                                                alternativeFlightsDefaultSort={alternativeFlightsDefaultSort}
                                                isUrgencyMessageVisible={isUrgencyMessageVisible}
                                                isInAmendHotelFlow={isInAmendHotelFlow}
                                            />
                                        )}
                                    </div>

                                    {isUrgencyMessageVisibleOnBottom && (
                                        <UrgencyMessage
                                            className={classNames(
                                                cardOptionsStyles.urgentPillContent,
                                                cardOptionsStyles.priority,
                                            )}
                                            message={urgencyMessageText}
                                            tooltip={urgencyMessageTooltipText}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {isInAmendHotelFlow ? (
                        <AmendHotelOfferCardFooter
                            onSelectHotel={onClickSelect}
                            fields={hotelOfferCardFields}
                            offer={offer}
                            amendHotelOffer={amendHotelOffer}
                        />
                    ) : (
                        <OfferCardFooter
                            offer={offer}
                            hotelLink={hotelLink}
                            onClickSelect={onClickSelect}
                            isSelectionEditMode={isSelectionEditMode}
                            isShortlistOfferUnavailable={isShortlistOfferUnavailable}
                            hasShortlistBookmark={hasShortlistBookmark}
                            routeDep={routeDep}
                            rendering={rendering}
                            hotelLinkWithPrice={hotelLinkWithPrice}
                            isLuxury={isLuxury}
                        />
                    )}
                </div>
            </LuxuryWrapper>
        </div>
    );
};

export default withRerender(observer(OfferCard));

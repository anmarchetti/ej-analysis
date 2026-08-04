import React, { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getDestinationLivePriceByCode } from 'frontend/utils/livePrice.utils';
import { getOfferAccomCode, isShortlistedOfferUnavailableForBooking } from 'frontend/utils/shortlist.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { isLoadedStatus, isLoadingStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import OffersPriceViewToggle from 'frontend/components/common/OffersPriceViewToggle';
import Pagination from 'frontend/components/common/Pagination/Pagination';
import {
    useCompareStore,
    withCompareStore,
} from 'frontend/components/renderings/CompareDeals/stores/createCompareLocalStore';
import OfferCard from 'frontend/components/renderings/SearchResults/components/OfferCard';
import SearchResultsLoadingSkeleton from 'frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton';

import ShortlistBanner from './components/ShortlistBanner';
import ShortlistRedirectPopup from './components/ShortlistRedirectPopup/ShortlistRedirectPopup';
import ShortlistRemovePopup from './components/ShortlistRemovePopup';
import ShortlistToolbar from './components/ShortlistToolbar/ShortlistToolbar';
import { IShortlistsSitecoreFields } from './interfaces';

export type TShortlistsProps = ISitecoreComponent<IShortlistsSitecoreFields, null>;

const Shortlists: FC<TShortlistsProps> = ({ fields, rendering }) => {
    const {
        initialize,
        offers,
        trackShortlistView,
        getLivePrice,
        clearShortlist,
        toggleRemovePopup,
        toggleRedirectPopup,
        fetchOffers,
        deleteShortlistedItems,
        onShortlistItemDeleted,
        selectedOffers,
        clearSelectedOffers,
        getSetting,
        selectShortlistOfferForBooking,
        getPhrase,
        status,
        totalOffers,
        itemsOnEachPage,
        currentPage,
        setPageNumber,
        isShortlistEditMode,
        isOfferSelected,
        toggleOfferSelection,
        isRemovePopupShown,
        isRedirectPopupShown,
        isShortlistsLivePriceEnabled,
    } = useStore((stores: IHolidaysStores) => ({
        initialize: stores.shortlistStore.initializeShortlists,
        offers: stores.shortlistStore.offers,
        trackShortlistView: stores.trackingStore.trackShortlistView,
        getLivePrice: stores.hotelsStore.getLivePrice,
        clearShortlist: stores.shortlistStore.clearShortlist,
        toggleRemovePopup: stores.shortlistStore.toggleRemovePopup,
        toggleRedirectPopup: stores.shortlistStore.toggleRedirectPopup,
        fetchOffers: stores.shortlistStore.fetchShortlistOffers,
        deleteShortlistedItems: stores.shortlistStore.deleteShortlistedItems,
        onShortlistItemDeleted: stores.shortlistStore.onShortlistItemDeleted,
        selectedOffers: stores.shortlistStore.selectedOffers,
        clearSelectedOffers: stores.shortlistStore.clearSelectedOffers,
        getSetting: stores.layoutStore.getSetting,
        selectShortlistOfferForBooking: stores.shortlistStore.selectShortlistOfferForBooking,
        getPhrase: stores.layoutStore.getPhrase,
        status: stores.shortlistStore.offersStatus,
        totalOffers: stores.shortlistStore.totalOffers,
        itemsOnEachPage: stores.shortlistStore.take,
        currentPage: stores.shortlistStore.page,
        setPageNumber: stores.shortlistStore.setPageNumber,
        isShortlistEditMode: stores.shortlistStore.isShortlistEditMode,
        isOfferSelected: stores.shortlistStore.isOfferSelected,
        toggleOfferSelection: stores.shortlistStore.toggleOfferSelection,
        isRemovePopupShown: stores.shortlistStore.isRemovePopupShown,
        isRedirectPopupShown: stores.shortlistStore.isRedirectPopupShown,
        isShortlistsLivePriceEnabled: stores.layoutStore.isShortlistsLivePriceEnabled,
    }));

    const { isOfferSelectedToCompare, isCompareModeEnabled } = useCompareStore();

    const [prices, setPrices] = useState<ILivePrice[]>([]);

    useEffect(() => {
        initialize();

        return () => {
            clearShortlist();
            toggleRemovePopup(false);
            toggleRedirectPopup(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (offers.length) {
            loadLivePrices();
            trackShortlistView(offers);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offers]);

    const loadLivePrices = async (): Promise<void> => {
        if (!isShortlistsLivePriceEnabled) {
            return;
        }

        // Load live price for unavailable packages and shortlisted hotels
        const codes = offers.reduce((codes, offer) => {
            const shouldUseGiataCodeForLivePrice = isShortlistedOfferUnavailableForBooking(offer);

            if (shouldUseGiataCodeForLivePrice) {
                const { giataCode } = offer;

                giataCode && !codes.includes(giataCode) && codes.push(giataCode);
            }

            return codes;
        }, [] as string[]);

        const prices = await getLivePrice(codes);

        setPrices(prices);
    };

    const loadNextPage = async (): Promise<void> => {
        await fetchOffers();
        loadLivePrices();

        if (offers.length) {
            trackShortlistView(offers);
        }
    };

    const onRemove = (): void => {
        deleteShortlistedItems(selectedOffers, () => onShortlistItemDeleted());
    };

    const onCloseRemovePopup = (): void => {
        toggleRemovePopup(false);
        clearSelectedOffers();
    };

    const onRedirect = (): void => {
        clearSelectedOffers();
    };

    const onCloseRedirectPopup = (): void => {
        toggleRedirectPopup(false);
        clearSelectedOffers();
    };

    const onSelectOffer = (offer: IOffer): void => {
        selectShortlistOfferForBooking(offer);
    };

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    if (!fields) {
        return null;
    }

    return (
        <>
            <ShortlistBanner title={fields.Title} />

            <div className='wrapper-component-container'>
                <div className='wrapper-component-container__inner wrapper-container--px'>
                    {isLoadingStatus(status) && <SearchResultsLoadingSkeleton />}
                    {isLoadedStatus(status) && !!offers?.length && (
                        <>
                            <div className='hotel-search-results-header'>
                                <div className='results-count'>
                                    <p>
                                        {`${totalOffers} ${getPhrase(
                                            totalOffers > 1
                                                ? SitecoreDictionary.GlobalsLabelsHolidays
                                                : SitecoreDictionary.GlobalsLabelsHoliday,
                                        )}`}
                                    </p>
                                </div>
                                <OffersPriceViewToggle />
                            </div>
                            <div className='hotel-search-results'>
                                {offers.map((offer, index) => {
                                    const offerCodeForLivePrice = isShortlistedOfferUnavailableForBooking(offer)
                                        ? offer.giataCode
                                        : getOfferAccomCode(offer);

                                    return (
                                        <OfferCard
                                            key={index}
                                            offer={offer}
                                            offerIndex={index}
                                            fallbackImage={fallbackImage}
                                            onSelect={(offer): void => onSelectOffer(offer)}
                                            hasShortlistBookmark={!isShortlistEditMode && !isCompareModeEnabled}
                                            isSelectionEditMode={isShortlistEditMode}
                                            isSelectedToCompare={isOfferSelectedToCompare(offer)}
                                            isSelectedToEdit={isOfferSelected(offer)}
                                            onToggleEditSelection={toggleOfferSelection}
                                            livePrice={getDestinationLivePriceByCode(offerCodeForLivePrice, prices)}
                                            rendering={rendering}
                                            ShortlistFields={fields}
                                        />
                                    );
                                })}
                            </div>
                            {totalOffers > itemsOnEachPage && (
                                <Pagination
                                    fetchResults={loadNextPage}
                                    numberOfResults={totalOffers}
                                    itemsOnEachPage={itemsOnEachPage}
                                    currentPage={currentPage}
                                    setCurrentPage={setPageNumber}
                                    mobilePaginationDisabled
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {isLoadedStatus(status) && !!offers?.length && <ShortlistToolbar fields={fields} rendering={rendering} />}
            {isRemovePopupShown && (
                <ShortlistRemovePopup offers={selectedOffers} onClose={onCloseRemovePopup} onRemove={onRemove} />
            )}
            {isRedirectPopupShown && fields && (
                <ShortlistRedirectPopup
                    offer={selectedOffers[0]}
                    onClose={onCloseRedirectPopup}
                    onRedirect={onRedirect}
                    title={fields.RedirectTitle}
                    bodyContent={fields.RedirectDescription}
                    redirectLabel={fields.RedirectButtonLabel}
                />
            )}
        </>
    );
};

export default withCompareStore(observer(Shortlists));

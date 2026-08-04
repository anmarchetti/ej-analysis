import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import SiteSettings from 'models/enum/SiteSettings';
import Checkbox from 'frontend/components/common/Checkbox';

const OffersPriceViewToggle = () => {
    const {
        isScreenLessMedium,
        getSetting,
        isPriceViewToggleEnabled,
        isOffersPriceViewTotal,
        onChangeOffersPriceView,
        isShortlistPage,
        isSearchResultsPage,
        isPromoPage,
        isAnyShortlistMultiplePersonOfferNotExpired,
        adultsQuantity,
        childrenQuantity,
        isKidsGoFree,
        setIsPriceFilterPerPerson,
    } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        getSetting: stores.layoutStore.getSetting,
        isPriceViewToggleEnabled: stores.layoutStore.isPriceViewToggleEnabled,
        isOffersPriceViewTotal: stores.layoutStore.isOffersPriceViewTotal,
        onChangeOffersPriceView: stores.layoutStore.onChangeOffersPriceView,
        isShortlistPage: stores.layoutStore.isShortlistPage,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        isPromoPage: stores.layoutStore.isPromoPage,
        isAnyShortlistMultiplePersonOfferNotExpired:
            isHolidayStore(stores) && stores.shortlistStore.isAnyShortlistMultiplePersonOfferNotExpired,
        adultsQuantity: stores.bookingStore.adultsQuantity,
        childrenQuantity: stores.bookingStore.childrenQuantity,
        isKidsGoFree: stores.searchStore.searchWho.isKidsGoFree,
        setIsPriceFilterPerPerson: stores.searchFiltersStore.setIsPriceFilterPerPerson,
    }));

    const onPriceViewChange = () => {
        onChangeOffersPriceView();
        setIsPriceFilterPerPerson(isOffersPriceViewTotal);
    };

    const isShownOnShortlistPage = isShortlistPage && isAnyShortlistMultiplePersonOfferNotExpired;

    //stores.searchStore.totalPaidGuestPlaces should not be used here
    //because it changes values ​​when the modal PromopageSearchPod is opened
    const guestQuantity = adultsQuantity + (isKidsGoFree ? 0 : childrenQuantity);
    const isShownOnOfferResultsPage = (isSearchResultsPage || isPromoPage) && guestQuantity > 1;

    return isPriceViewToggleEnabled && (isShownOnShortlistPage || isShownOnOfferResultsPage) ? (
        <div className='offers-price-view-toggle'>
            <Checkbox
                toggle
                onChange={onPriceViewChange}
                label={
                    !isScreenLessMedium
                        ? getSetting(SiteSettings.TogglePricePPDesktopLabel)
                        : getSetting(SiteSettings.TogglePricePPMobileLabel)
                }
                label2={
                    !isScreenLessMedium
                        ? getSetting(SiteSettings.ToggleTotalPriceDesktopLabel)
                        : getSetting(SiteSettings.ToggleTotalPriceMobileLabel)
                }
                checked={!isOffersPriceViewTotal}
            />
        </div>
    ) : null;
};

export default observer(OffersPriceViewToggle);

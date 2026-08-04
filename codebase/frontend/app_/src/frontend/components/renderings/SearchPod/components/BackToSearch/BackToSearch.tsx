import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { parseDateL10n } from 'frontend/utils/date.utils';
import { getWebStorageItem, parseValueFromLocalStorage } from 'frontend/utils/webStorage.utils';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import BackToReferrer from 'frontend/components/common/BackToReferrer/BackToReferrer';
import { buildBackLinkUrl } from 'frontend/components/common/BackToReferrer/BackToReferrer.utils';
import Button from 'frontend/components/common/Button';
import IconChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import IconCross from 'frontend/components/icons-new/Cross';
import IconPen from 'frontend/components/icons-new/EditLine';

import { useBackButtonLabel, useEditButtonLabel } from './BackToSearch.utils';

import styles from './BackToSearch.module.scss';

export interface IBackToSearchProps {
    isBackButtonAvailable: boolean;
    isEditMode: boolean;
    onClickEdit: (isEdit?: boolean) => void;
}

export const BackToSearch = ({ isBackButtonAvailable, isEditMode, onClickEdit }: IBackToSearchProps): JSX.Element => {
    const {
        updateSearchDates,
        updateSearchOrigins,
        isBackToPromo,
        retreiveSearchParameters,
        isBackToPrevUrl,
        onClickBackButton,
        isHotelDetailsBookPage,
        setIsSearchPodExpanded,
        setOldSearchParamToSearchParam,
        setOldSearchParam,
        isOldParamSet,
        returnPathFromHotelDetailsFromUrl,
        isSearchResultsPagePrev,
        referrer,
        isMobileAppHideFeatures,
    } = useStore(stores => ({
        updateSearchDates: stores.bookingStore.updateSearchDates,
        updateSearchOrigins: stores.bookingStore.updateSearchOrigins,
        isBackToPromo: stores.routerStore.hasPromo,
        retreiveSearchParameters: stores.searchStore.retreiveSearchParameters,
        isBackToPrevUrl: stores.routerStore.isBackToPrevUrl,
        onClickBackButton: () => {
            if (stores.layoutStore.isHotelDetailsBookPage && stores.searchStore.searchWhen.isFlexible) {
                stores.bookingStore.updateSearchDates(
                    stores.searchStore.searchWhen.from,
                    stores.searchStore.searchWhen.to,
                );
            }

            stores.searchStore.setPageNumber(stores.searchStore.prevPage ?? stores.searchStore.page ?? 1);

            if (!stores.routerStore.isBackToPrevUrl) {
                // since selectedAccommodationCodes is the condition (?) for redirecting to the hotel detail page,
                // we prevent this by resetting the value of selectedAccommodationCodes
                // https://jira.build.easyjet.com/browse/EJH-18074
                stores.searchStore.searchTo.setSelectedAccommodationCodes('');
            }

            stores.routerStore.onClickBackButton(stores.routerStore.backToSearchUrl, {
                BackToPromoFromHotelDetails: stores.routerStore.hasPromo,
            });
        },

        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        setIsSearchPodExpanded: stores.searchStore.setIsSearchPodExpanded,
        setOldSearchParamToSearchParam: stores.searchStore.setOldSearchParamToSearchParam,
        setOldSearchParam: stores.searchStore.setOldSearchParam,
        isOldParamSet: stores.searchStore.isOldParamSet,
        isSearchResultsPagePrev: stores.layoutStore.isSearchResultsPagePrev,
        returnPathFromHotelDetailsFromUrl: stores.queryParamStore.returnPathFromHotelDetailsFromUrl,
        referrer: stores.layoutStore.referrer,
        isMobileAppHideFeatures: stores.layoutStore.isMobileAppHideFeatures,
    }));

    const isMobile = useMobileViewport();
    const backButtonLabel = useBackButtonLabel(isMobile, isBackToPrevUrl);
    const editButtonLabel = useEditButtonLabel(isMobile, isEditMode);

    // If referrer is empty the user landed directly in this page so there is
    // no reason to follow the returnPath param. We can keep the default behavior
    const backToFlightsUrl = buildBackLinkUrl(referrer, returnPathFromHotelDetailsFromUrl);
    const shouldShowBackToFlights = !!backToFlightsUrl && !isSearchResultsPagePrev;

    // At this moment back to search and back to flights are mutually exclusive
    const shouldShowBackToSearch = !shouldShowBackToFlights && isBackButtonAvailable;

    // If none of the back buttons are rendered we need to add a placeholder
    // to keep the page structure
    const shouldShowPlaceHolder = !shouldShowBackToFlights && !shouldShowBackToSearch;

    const restoreSearchDataFromLocalStorage = () => {
        if (isBackToPromo) {
            const prefilledParams = getWebStorageItem(WebStorageKeys.Promopage);

            if (prefilledParams) {
                const { searchStore } = parseValueFromLocalStorage(prefilledParams);
                const from = parseDateL10n(searchStore?.searchWhen.from);
                const to = parseDateL10n(searchStore?.searchWhen.to);

                updateSearchDates(from, to);
                updateSearchOrigins(searchStore?.origins);
            } else {
                // if user don't have saved data in LS will set dates and origins to default for Promo
                // for example if offer have opened in incognito mode
                updateSearchDates('', '');
                updateSearchOrigins([]);
            }
        } else {
            retreiveSearchParameters(true);
        }
    };

    const onEditSearchClick = (): void => {
        isHotelDetailsBookPage && setIsSearchPodExpanded(!isEditMode);
        isOldParamSet ? setOldSearchParamToSearchParam() : setOldSearchParam();
        onClickEdit();
    };

    return (
        <div className='wrapper--solid wrapper--solid--white search-nav-wrapper'>
            <div className='wrapper-container wrapper-container--px'>
                <div className='search-nav'>
                    {shouldShowBackToFlights && <BackToReferrer returnPath={returnPathFromHotelDetailsFromUrl} />}
                    {shouldShowBackToSearch && (
                        <div className='search-nav__item' data-tid='back-to-search'>
                            <Button
                                isText
                                isTransparent
                                className='search-nav__link'
                                dataTid='go-back-link'
                                onClick={(e): void => {
                                    e.preventDefault();

                                    restoreSearchDataFromLocalStorage();
                                    onClickBackButton();
                                }}
                            >
                                <IconChevronLeft />
                                <span>{backButtonLabel}</span>
                            </Button>
                        </div>
                    )}

                    {shouldShowPlaceHolder && <div className='search-nav__item' data-tid='nav-item-placeholder' />}
                    {!shouldShowBackToFlights && (
                        <div
                            className={classNames('search-nav__item', 'search-nav__item--right', {
                                [styles.appEditButton]: isMobileAppHideFeatures,
                            })}
                            data-tid='edit-search'
                        >
                            <Button isText isTransparent onClick={onEditSearchClick} className='search-nav__link'>
                                {isEditMode ? <IconCross /> : <IconPen />}
                                <span>{editButtonLabel}</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(BackToSearch);

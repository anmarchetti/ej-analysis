import React, { FC, useEffect } from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalStore } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useConstructor from 'frontend/hooks/useConstructor';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { unLockBodyScroll } from 'frontend/utils/ui.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { DataStatus } from 'models/enum/DataStatus';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import Drawer from 'frontend/components/common/Drawer';
import { JSSImage } from 'frontend/components/common/JSSImage';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import DateViewDropdown from 'frontend/components/common/SearchBarDropdownWhen/components/DateViewDropdown/DateViewDropdown';
import SearchBarDropdownWho from 'frontend/components/common/SearchBarDropdownWho/SearchBarDropdownWho';
import IconBed from 'frontend/components/icons/Bed';
import IconCalendar from 'frontend/components/icons/Calendar';
import SvgEditFilled from 'frontend/components/icons-new/EditFilled';

import FakeSearchBarInput from './components/FakeSearchBarInput/FakeSearchBarInput';
import PopupSearchPod from './components/PopupSearchPod';
import PromoPageSearchPodDescription from './components/PromoPageSearchPodDescription';
import SearchBarInput from './components/SearchBarInput/SearchBarInput';
import createStore from './PromopageSearchPod.store';
import { getWhenError } from './PromopageSearchPod.utils';

import styles from './components/PopupSearchPod.module.scss';

export interface IPromopageSearchPodProps
    extends ISitecoreComponent<IPromopageSearchPodFields, IPromopageSearchPodParameters>,
        IComponentWithDictionary {
    pageFields: { [name: string]: ISitecoreField<any> } | null;
}

export interface IPromopageSearchPodParameters {
    IsSlantTranslucent: TSitecoreCheckboxValue;
    EnableSeoReadMoreText?: TSitecoreCheckboxValue;
}

export interface IPromopageSearchPodFields {
    data: {
        CurrentSearchText: ISitecoreField<string>;
        Icon: ISitecoreField<ISitecoreImage>;
        Image: ISitecoreField<ISitecoreImage>;
        StartSearchText: ISitecoreField<string>;
    };
}

const PromopageSearchPod: FC<IPromopageSearchPodProps> = ({ rendering, params }) => {
    const source = useStore((stores: TStores) => ({
        isDynamicPromoPageLayout: stores.layoutStore.isDynamicPromoPageLayout,
        updateSearchParamsAndExecuteSearch: stores.promoPageStore.updateSearchParamsAndExecuteSearch,
        getSeasonName: stores.promoPageStore.getSeasonName,
        clearPromopageStore: stores.promoPageStore.clearPromopageStore,
        getPhrase: stores.layoutStore.getPhrase,
        isTradePortal: stores.layoutStore.isTradePortal,
        isNeedOpenWhenField: stores.searchStore.isNeedOpenWhenField,
        setNeedOpenWhenField: stores.searchStore.setNeedOpenWhenField,
        isNeedOpenWhoField: stores.searchStore.isNeedOpenWhoField,
        setNeedOpenWhoField: stores.searchStore.setNeedOpenWhoField,
        clearDates: stores.searchStore.searchWhen.clearDates,
        from: stores.searchStore.searchWhen.from,
        to: stores.searchStore.searchWhen.to,
        page: stores.searchStore.page,
        whoValue: stores.searchStore.searchWho.whoValue,
        prevTemplateId: stores.layoutStore.prevTemplateId,
        isEditMode: stores.layoutStore.isEditMode,
        pageFields: stores.layoutStore.pageFields,
        availableDates: stores.searchStore.searchWhen.availableDates,
        rooms: stores.searchStore.searchWho.roomsAllocation,
        isScreenMedium: stores.appStore.isScreenMedium, // shouldn't be deleted due to usage in PromopageSearchPod.store
        isFlexible: stores.searchStore.searchWhen.isFlexible,
        setOverrideWhoValue: stores.promoPageStore.setOverrideWhoValue,
        flexDays: stores.searchStore.searchWhen.flexDays,
        prevFlexDays: stores.searchStore.searchWhen.prevFlexDays,
        isAutoAllocation: stores.searchStore.searchWho.isAutoAllocation,
        errorMessages: stores.searchStore.errorMessages,
        isWhoParamsValid: stores.searchStore.searchWho.isWhoParamsValid,
        isWhenParamsValid: stores.searchStore.searchWhen.isWhenParamsValid,
        layoutId: stores.layoutStore.layoutId,
        pageName: stores.layoutStore.pageName,
        setIsAutoAllocation: stores.searchStore.searchWho.setIsAutoAllocation,
        onClearRoom: stores.searchStore.searchWho.onClearRoom,
        validatePromoPageSearchParameters: stores.searchStore.validatePromoPageSearchParameters,
        changeIsPresetDestinationFilter: stores.searchFiltersStore.changeIsPresetDestinationFilter,
        grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
        closeFilters: stores.searchFiltersStore.onCloseFilters,
        changePage: stores.searchStore.setPageNumber,
        changeFlexible: stores.searchStore.searchWhen.onChangeFlexible,
        changePrevFlexible: stores.searchStore.searchWhen.onChangePrevFlexDays,
        clearBookingFlow: stores.bookingStore.clearBookingFlow,
        clearPaymentStore: stores.paymentStore.clearPaymentStore,
        clearIsClickBackToSearch: stores.routerStore.clearIsClickBackToSearch,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        setSelectedOfferIndex: stores.searchStore.setSelectedOfferIndex,
        updateDataLayer: stores.trackingStore.searchEditTrigger,
        fetchOffers: stores.hotelsStore.fetchOffers,
        updateDestinationCodes: stores.searchStore.searchTo.updateDestinationCodes,
        clearOldSearchParam: stores.searchStore.clearOldSearchParam,
        setSearchPerformWithNewParams: stores.searchStore.setSeachPerformWithNewParams,
        loadAllDestinations: stores.searchStore.searchTo.loadAllDestinations,
        updateAvailableOrigins: stores.searchStore.searchFrom.updateAvailableOrigins,
        updateAvailableDstCodes: stores.searchStore.searchTo.updateAvailableDstCodes,
        updateAvailableDates: stores.searchStore.searchWhen.updateAvailableDates,
        prefillPromoPage: stores.promoPageStore.prefillPromoPage,
        restoreFromLocalStorage: stores.promoPageStore.restoreFromLocalStorage,
        prefillPromoPageFilters: stores.promoPageStore.prefillPromoPageFilters,
        setBackgroundFilters: stores.promoPageStore.setBackgroundFilters,
        clearSearchParams: stores.bookingStore.clearSearchParams,
        isApplySpecialFilter: stores.layoutStore.isApplySpecialFilter,
        clearSearchValues: stores.searchStore.clearSearchValues,
        clearFilterStoreValues: stores.searchFiltersStore.clearFilterStoreValues,
        clearPromoPageDestination: stores.promoPageStore.clearPageDestination,
        clearErrorMessage: stores.searchStore.clearErrorMessage,
        hasErrorInField: stores.searchStore.hasErrorInField,
        onClearDates: stores.searchStore.searchWhen.clearDates,
        setDates: stores.searchStore.searchWhen.setDates,
        setRoomsAllocation: stores.searchStore.searchWho.setRoomsAllocation,
        trackUserSearch: stores.searchStore.trackUserSearch,
        getSetting: stores.layoutStore.getSetting,
        collectOriginsTitles: stores.searchStore.collectOriginsTitles,
        updateOffersDataStatus: stores.hotelsStore.updateOffersDataStatus,
        onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
        getFlexDays: stores.layoutStore.getFlexDays,
        isGuestsParametersValid: stores.searchStore.searchWho.isGuestsParametersValid,
        validateChildrenAge: stores.searchStore.searchWho.validateChildrenAge,
        validateWhenParameters: stores.searchStore.validateWhenParameters,
        isInitialPaxIsDefault: stores.promoPageStore.isInitialPaxIsDefault,
    }));

    const isMobile = useMobileViewport();
    const isNeedInitialRequest = !source.isSearchResultsPage && !source.isDynamicPromoPageLayout;

    useConstructor(() => {
        // Set initial loading state for "hotelsStore",
        // to prevent CSS layout shift of changing this state in useEffect in "store.initialize"
        if (isNeedInitialRequest) {
            source.updateOffersDataStatus(DataStatus.Loading);
        }
    });

    const { getPhrase, getSetting, getFlexDays } = source;
    const { Name, Image, Icon, PromoDescription, IsFlexibleDatesRange, IsImageDisplayedOnMobile, HolidayThemes } =
        source.pageFields || {};

    const store = useLocalStore(createStore, source);
    const showWhenPopup = action(store.showPopup.bind(store, SearchBarDropdown.When));
    const showWhoPopup = action(store.showPopup.bind(store, SearchBarDropdown.Who));
    const showPopup = (): void => {
        if (source.isInitialPaxIsDefault()) {
            showWhenPopup();
        } else {
            showWhoPopup();
        }
    };

    const flexLabel = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.PromopageSearchPodLabelsFlexibleDates),
        Tokens.FlexDays,
        store.flexDays,
    );

    const pageTitle = Tokenizer.replaceTokens(Name?.value, {
        [Tokens.HolidayTheme]: HolidayThemes?.[0]?.fields.Name?.value,
        [Tokens.Season]: source.getSeasonName() ?? '',
    });

    const showTooltip = !!Number(getSetting(SiteSettings.EnablePromoBannerTooltip));

    const onClosePopup = action(() => {
        store.flexDays !== source.prevFlexDays && source.changeFlexible(source.prevFlexDays);
        store.closePopup();
    });

    const onApplySearchWithWhenField = (): void => {
        source.onChangeSearchFilterStore({ key: 'isFiltersLoaded', value: false });
        store.onSubmitSearch();
        source.changePrevFlexible(source.flexDays);
    };

    const onApplyWhoField = (): void => {
        source.setNeedOpenWhenField(true);
    };

    // clear and init store on promo page change, but not on search result page
    // where old origins should be used for next search/sort
    useEffect(() => {
        if (isNeedInitialRequest) {
            // clear store without making additional requests (requests will be done by initialize)
            store.clearStore(true);
            store.initialize();
        }

        return () => {
            source.clearPromopageStore();
            store.clearStore(true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source.layoutId]);

    // if choose dates button was clicked
    useEffect(() => {
        if (source.isNeedOpenWhenField) {
            showWhenPopup();
            source.setNeedOpenWhenField(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source.isNeedOpenWhenField]);

    useEffect(() => {
        if (source.isNeedOpenWhoField) {
            showWhoPopup();
            source.setNeedOpenWhoField(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source.isNeedOpenWhoField]);

    useEffect(() => {
        const flexDays = getFlexDays(!!IsFlexibleDatesRange?.value);

        // we must compare only once on mount,
        // this is why there is no source.flexDays in deps
        if (source.flexDays !== flexDays) {
            source.changePrevFlexible(flexDays);
            source.changeFlexible(flexDays);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [IsFlexibleDatesRange?.value]);

    useEffect(() => {
        source.setOverrideWhoValue();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source.isDynamicPromoPageLayout]);

    useEffect(() => {
        source.clearDates();

        source.collectOriginsTitles(rendering.fields?.airportsGroups ?? []);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (source.isDynamicPromoPageLayout) {
            source.restoreFromLocalStorage();
            source.updateSearchParamsAndExecuteSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source.page]);

    const isApplyDisabled = !store.isParamsValid;

    return (
        <div className='promopage-search-pod'>
            <div
                className={classNames({
                    'promopage-search-pod--no-mobile-img': !IsImageDisplayedOnMobile?.value,
                    'promopage-search-pod--translucent-slant': !!params?.IsSlantTranslucent,
                })}
            >
                <div className='promopage-search-pod__wrapper'>
                    <div className='promopage-search-pod__image'>
                        {!source.isEditMode && (
                            <JSSImageNext
                                field={Image}
                                mediaSize={{
                                    desktop: MediaSize.Big,
                                }}
                                fill
                                priority
                            />
                        )}
                    </div>

                    <div className='promopage-search-pod__container wrapper-container wrapper-container--px'>
                        <div className='promopage-search-pod__content'>
                            <div className='promopage-search-pod__header'>
                                {pageTitle && <h1 className='promopage-search-pod__title'>{pageTitle}</h1>}

                                {Icon?.value?.src && (
                                    <div className='promopage-search-pod__icon'>
                                        <JSSImage field={Icon} />
                                    </div>
                                )}
                            </div>
                            <div className='promopage-search-pod__subtitle'>
                                {getPhrase(
                                    store.isSubmitted
                                        ? SitecoreDictionary.SearchPodPromoPageLabelsCurrentSearch
                                        : SitecoreDictionary.SearchPodPromoPageLabelsStartSearch,
                                )}
                            </div>
                            <div
                                className={classNames(
                                    'promopage-search-pod__form',
                                    store.isSubmitted && 'promopage-search-pod__form--submitted',
                                )}
                            >
                                <FakeSearchBarInput
                                    id='promo-search-who'
                                    icon={
                                        <i>
                                            <IconBed />
                                        </i>
                                    }
                                    label={getPhrase(SitecoreDictionary.SearchPodLabelsWho)}
                                    placeholder={getPhrase(SitecoreDictionary.SearchPodPlaceholdersWhoField)}
                                    value={store.submittedWho}
                                    onClick={showWhoPopup}
                                    isSubmitted={store.isSubmitted}
                                />
                                <FakeSearchBarInput
                                    id='promo-search-when'
                                    icon={<IconCalendar />}
                                    label={getPhrase(SitecoreDictionary.SearchPodLabelsWhen)}
                                    placeholder={getPhrase(SitecoreDictionary.SearchPodPlaceholdersWhenField)}
                                    value={store.submittedWhen}
                                    onClick={showWhenPopup}
                                    isSubmitted={store.isSubmitted}
                                    extraLabel={store.isFlexible && flexLabel}
                                />
                            </div>
                            <div className='promopage-search-pod__buttons'>
                                <Button onClick={showPopup} isTransparent>
                                    <SvgEditFilled />
                                    {getPhrase(SitecoreDictionary.SearchPodButtonsEditMobile)}
                                </Button>
                                {showTooltip && (
                                    <Callout
                                        content={
                                            <div>{getPhrase(SitecoreDictionary.SearchPodPromoPageLabelsTooltip)}</div>
                                        }
                                        orientation={isMobile ? CalloutOrientation.Bottom : CalloutOrientation.Right}
                                        position={CalloutPosition.Center}
                                        isShownOnHover
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PromoPageSearchPodDescription
                PromoDescription={PromoDescription}
                EnableSeoReadMoreText={params?.EnableSeoReadMoreText}
                rendering={rendering}
            />

            {isMobile && (
                <div
                    className={classNames(
                        'promopage-search-pod__drawer-container',
                        'sbv3 search-bar',
                        'search-bar-box',
                    )}
                >
                    <Drawer open={store.activeField === SearchBarDropdown.When}>
                        <div className='search-bar__mobile-box'>
                            <div className={store.getDropDownWrClassName(SearchBarDropdown.When)}>
                                {store.activeField === SearchBarDropdown.When && (
                                    <DateViewDropdown
                                        value={store.dates}
                                        onClose={onClosePopup}
                                        onApply={action(() => {
                                            onApplySearchWithWhenField();
                                            unLockBodyScroll(); // to scroll page position top when updates
                                        })}
                                        isFlexible={store.isFlexible}
                                        flexDays={store.flexDays}
                                        availableDates={store.availableDates}
                                        isApplyDisabled={isApplyDisabled}
                                        errorMessage={getWhenError(store.errorMessages, store.activeField)}
                                    />
                                )}
                            </div>
                        </div>
                    </Drawer>

                    <Drawer open={store.activeField === SearchBarDropdown.Who}>
                        <div className='search-bar__mobile-box'>
                            <div className='search-bar__input-wr'>
                                <SearchBarInput
                                    id='search-who--drawer'
                                    icon={<IconBed />}
                                    label={getPhrase(SitecoreDictionary.SearchPodLabelsWho)}
                                    placeholder={getPhrase(SitecoreDictionary.SearchPodPlaceholdersWhoField)}
                                    value={store.whoValue}
                                    isEditable={false}
                                    hidePlaceholder={store.activeField === SearchBarDropdown.Who}
                                    isError={!store.isGuestsParametersValid}
                                    showClearButton={false}
                                    isHighlighted={store.activeField === SearchBarDropdown.Who}
                                />
                            </div>

                            <div className={store.getDropDownWrClassName(SearchBarDropdown.Who)}>
                                {store.activeField === SearchBarDropdown.Who && (
                                    <SearchBarDropdownWho
                                        rooms={store.rooms}
                                        onClose={onClosePopup}
                                        onApply={action(onApplyWhoField)}
                                        onClearRoom={store.onClearRoomClick}
                                        isPromoViewForWhoField
                                        isMobilePromoViewForWhoField
                                        applyBtnText={getPhrase(SitecoreDictionary.GlobalsButtonsNext)}
                                        ignoreValidationOnClose
                                        maxGuestsErrorClassName={styles.maxGuestsError}
                                    />
                                )}
                            </div>
                        </div>
                    </Drawer>
                </div>
            )}

            {!isMobile && (
                <PopupSearchPod
                    whenValue={store.whenValue}
                    whoValue={store.whoValue}
                    isPopupOpen={store.isPopupOpen}
                    activeField={store.activeField}
                    dates={store.dates}
                    isFlexible={store.isFlexible}
                    flexDays={store.flexDays}
                    availableDates={store.availableDates}
                    isApplyDisabled={isApplyDisabled}
                    rooms={store.rooms}
                    togglePopup={store.togglePopup}
                    setActiveField={store.setActiveField}
                    isError={store.hasErrorInField}
                    onClearDates={store.onClearDates}
                    closePopup={onClosePopup}
                    onSubmitSearch={onApplySearchWithWhenField}
                    onClearRoomClick={store.onClearRoomClick}
                    errorMessages={store.errorMessages}
                    isGuestsParametersValid={store.isGuestsParametersValid}
                    validateChildrenAge={source.validateChildrenAge}
                    validateWhenParameters={source.validateWhenParameters}
                />
            )}
        </div>
    );
};

export default observer(PromopageSearchPod);

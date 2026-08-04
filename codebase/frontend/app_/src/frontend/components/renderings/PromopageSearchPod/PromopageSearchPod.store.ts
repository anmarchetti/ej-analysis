import classNames from 'classnames';
import { toJS } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { formatDatesRange } from 'frontend/utils/date.utils';
import { cloneRoomAllocationArray } from 'frontend/utils/search/search.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import SiteSettings from 'models/enum/SiteSettings';
import { RoomAllocation } from 'models/RoomAllocation';
import { isRoomAllocationNonStandard } from 'models/RoomAllocation.utils';

export default function createStore(source: any) {
    return {
        isPopupOpen: false,
        activeField: undefined as SearchBarDropdown | undefined,

        _submittedWhen: null as string | null,
        _submittedWho: null as string | null,

        _savedFrom: null as Date | null,
        _savedTo: null as Date | null,
        _savedRooms: null as RoomAllocation[] | null,
        _savedIsAutoAllocation: false as boolean,

        get submittedWhen() {
            return this.isPopupOpen ? this._submittedWhen ?? '' : this._submittedWhen ?? this.whenValue;
        },

        get submittedWho() {
            return this.isPopupOpen ? this._submittedWho ?? '' : this._submittedWho ?? this.whoValue;
        },

        get isSubmitted() {
            return !!this.submittedWhen && !!this.submittedWho;
        },

        get dates() {
            if (source.from && source.to) {
                return [source.from, source.to];
            }

            if (source.from) {
                return [source.from];
            }

            return [];
        },

        get whenValue() {
            return source.from ? formatDatesRange(source.from, source.to, DATE_FORMATS.L) : '';
        },

        get whoValue() {
            return source.whoValue;
        },

        get availableDates() {
            return source.availableDates;
        },

        get rooms() {
            return source.rooms;
        },

        get isFlexible() {
            return source.isFlexible;
        },

        get flexDays() {
            return source.flexDays;
        },

        get errorMessages() {
            return source.errorMessages;
        },

        get isGuestsParametersValid() {
            return source.isGuestsParametersValid;
        },

        get isParamsValid() {
            return source.isWhenParamsValid && source.isWhoParamsValid;
        },

        initialize() {
            source.clearErrorMessage();

            source.loadAllDestinations();

            source.updateAvailableOrigins(true);
            source.updateAvailableDates();
            source.updateAvailableDstCodes(true);

            // check for navigate from not promo pages to promo page
            // Hotel details excluded because we shouldn't clear search params when we returned from details page
            if (source.prevTemplateId && source.prevTemplateId !== SitecoreTemplateId.HotelDetailsBook) {
                source.clearSearchParams();
            }

            this.prefillPromoPage();
            this.savePromoSpecialFilters();
        },

        clearStore(noUpdate = false) {
            this.isPopupOpen = false;
            this.setActiveField(undefined);

            this._submittedWhen = null;
            this._submittedWho = null;

            this._savedFrom = null;
            this._savedTo = null;
            this._savedRooms = null;
            this._savedIsAutoAllocation = false;

            source.clearSearchValues(noUpdate);
            source.clearFilterStoreValues();
            source.setBackgroundFilters();
            source.clearPromoPageDestination();
        },

        prefillPromoPage() {
            if (!source.isEditMode) {
                source.prefillPromoPage();
            }
        },

        savePromoSpecialFilters() {
            source.setBackgroundFilters(
                source.isApplySpecialFilter(SiteSettings.KidsGoFree, source.pageName),
                source.isApplySpecialFilter(SiteSettings.ShowSuperDeals, source.pageName),
            );
        },

        togglePopup() {
            this.isPopupOpen ? this.closePopup() : this.showPopup();
        },

        showPopup(activeField = SearchBarDropdown.When) {
            this._cloneCurrentValues();

            if (!this._submittedWhen) {
                this._submittedWhen = this.whenValue;
            }

            if (!this._submittedWho) {
                this._submittedWho = this.whoValue;
            }

            this.setActiveField(activeField);

            if (source.isScreenMedium) {
                this.isPopupOpen = true;
            }
        },

        closePopup(restore = true) {
            if (restore) {
                this._restoreFromClone();
            }

            this.setActiveField(undefined);
            this.isPopupOpen = false;
        },

        getDropDownWrClassName(ddType: SearchBarDropdown) {
            let typeSpecific = '';

            if (ddType) {
                if (ddType === SearchBarDropdown.When) {
                    typeSpecific = 'search-bar__dd-wr--when';
                } else if (ddType === SearchBarDropdown.Who) {
                    typeSpecific = 'search-bar__dd-wr--who';
                }
            }

            return classNames(
                'search-bar__dd-wr',
                this._isCloseBtnHidden(ddType) && 'search-bar__dd-wr--nothing-selected',
                typeSpecific,
            );
        },

        setActiveField(field?: SearchBarDropdown) {
            this.activeField = field;
        },

        onClearRoomClick() {
            source.onClearRoom();
        },

        onSubmitSearch() {
            const isValid = !source.validatePromoPageSearchParameters();

            if (isValid) {
                source.changeIsPresetDestinationFilter(false);

                // update applied search params
                source.grabSearchValuesFromSearchStore();

                // https://jira.build.easyjet.com/browse/EJH-12223
                source.trackUserSearch();

                // for now we are only on promo page (http://jra.europe.easyjet.local/browse/EJH-9516)
                this._onSubmitSearchFromPromoPage();

                // TO DO remove updateDestinationCodes as we don't need update destinations on search click
                source.updateDestinationCodes();
                source.clearOldSearchParam();
                source.setSearchPerformWithNewParams(true);

                this._submittedWhen = this.whenValue + '';
                this._submittedWho = this.whoValue + '';

                this.closePopup(false);
            } else {
                // Open Drawer with errors on mobile.
                // Use timeout to fix mobx issue (it updates errorMessages with delay)
                setTimeout(() => {
                    this.openDrawerWithErrors();
                });
            }
        },

        hasErrorInField(searchBarField: SearchBarDropdown): boolean {
            return source.hasErrorInField(searchBarField);
        },

        onClearDates() {
            source.onClearDates();
        },

        openDrawerWithErrors() {
            // Open invalid drawer if it's not already opened
            if (!source.isScreenMedium && this.activeField && !this.hasErrorInField(this.activeField)) {
                this.closePopup(false);

                // Use timeout for correct lock/unlock scroll on closing/opening drawer
                setTimeout(() => {
                    this.showPopup(SearchBarDropdown.When);
                });
            }
        },

        _cloneCurrentValues() {
            this._savedFrom = source.from ? new Date(source.from.getTime()) : null;
            this._savedTo = source.to ? new Date(source.to.getTime()) : null;
            this._savedRooms = source.rooms ? toJS(source.rooms) : null;
            this._savedIsAutoAllocation = source.isAutoAllocation ? source.isAutoAllocation : false;
        },

        _restoreFromClone() {
            source.clearErrorMessage();

            source.setDates([
                this._savedFrom ? new Date(this._savedFrom.getTime()) : null,
                this._savedTo ? new Date(this._savedTo.getTime()) : null,
            ]);

            const roomsAllocation: RoomAllocation[] = cloneRoomAllocationArray(
                this._savedRooms ?? [],
                source.isTradePortal,
            );

            source.setRoomsAllocation(roomsAllocation);
            source.setIsAutoAllocation(this._savedIsAutoAllocation);
            source.validateChildrenAge();
        },

        async _onSubmitSearchFromPromoPage() {
            // clear filters if either date or who has been changed
            if (this.whenValue !== this._submittedWhen || this.whoValue !== this._submittedWho) {
                source.clearFilterStoreValues();
                await source.prefillPromoPageFilters();
            } else {
                source.closeFilters();
            }

            source.changePage(1);
            source.clearBookingFlow();
            source.clearPaymentStore();
            source.clearIsClickBackToSearch();

            // disable auto scroll to previously selected item
            source.setSelectedOfferIndex(-1);

            source.updateDataLayer();

            window.scrollTo(0, 0);
            await source.fetchOffers(true);
        },

        _isCloseBtnHidden(ddType: SearchBarDropdown): boolean {
            let isEmpty = false;

            if (ddType === SearchBarDropdown.When) {
                isEmpty = this.dates.length === 0;
            } else if (ddType === SearchBarDropdown.Who) {
                const isRoomStandard = !isRoomAllocationNonStandard(source.rooms);

                isEmpty = !!source.rooms[0] && !source.isAutoAllocation && isRoomStandard;
            }

            return isEmpty;
        },
    };
}

export type TPromopageSearchPodStore = ReturnType<typeof createStore>;

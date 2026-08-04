import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { Anchor } from 'code/anchors';
import { ScreenBreakpoints } from 'code/screenBreakpoints';
import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';
import { debounce } from 'frontend/utils/debounce';
import isBackend from 'frontend/utils/isBackend';
import { scrollToOfferConditions } from 'frontend/utils/ui.utils';
import { IAmendDatesResponseItem } from 'models/data/bookingAmendment/AmendDates';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IAmendRoomAndBoardOffer } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IBookingInfoPayload } from 'models/data/IBookingInfo';
import { ISelectedFilter } from 'models/data/IFilters';
import { IAmendSeatsResponse } from 'models/data/ISeatMapStore';
import { ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export interface IAmendBookingPayload extends IBookingInfoPayload {
    amendDatesOffer?: IAmendDatesResponseItem;
    amendHotelOffer?: IAmendHotelOffer;
    amendRoomAndBoardOffer?: IAmendRoomAndBoardOffer;
    redirectedByBreadcrumbs?: boolean;
    selectedFlight?: IAmendTransport;
    selectedFlightFilters?: ISelectedFilter[];
    selectedSeats?: IAmendSeatsResponse;
    selectedTransfer?: ITransferWithAmendmentCharges;
}

class BaseAppStore {
    @observable isLoading: boolean = true;
    @observable breakpoint: number;

    @observable isNetworkPopupShown: boolean = false;
    @observable wasPopunderShown: boolean = false;

    @observable showOfferConditions = false;
    @observable wasMaintenancePopupShown = true;

    @observable isNavigationBooking = false;
    @observable notification: any;
    @observable isCookiesPopupWasShown: boolean = false;
    @observable isLandscapeOrientation: boolean = false;
    @observable amendBookingItemPayload: IAmendBookingPayload | undefined;

    constructor() {
        makeObservable(this);

        if (!isBackend()) {
            this.wasMaintenancePopupShown =
                !!sessionStorage.getItem(WebStorageKeys.IsMaintenancePopupWasShown) || false;
            this.breakpoint = window.innerWidth;
            window.addEventListener('resize', this.resizeListener);
            this.checkOrientation();
            globalThis.showNetworkIssuesPopup = () => this.showNetworkIssuesPopup(true);
            globalThis.hideNetworkIssuesPopup = () => this.showNetworkIssuesPopup(false);
        }
    }

    @action showNetworkIssuesPopup = (isShown: boolean) => {
        this.isNetworkPopupShown = isShown;
    };

    @action setWasPopunderShown = (state: boolean) => {
        this.wasPopunderShown = state;
    };

    /** screen < 576 (ScreenBreakpoints.XS) */
    @computed get isScreenExtraSmall() {
        return this.breakpoint < ScreenBreakpoints.XS;
    }

    /** screen >= 576 (ScreenBreakpoints.XS) */
    @computed get isScreenSmall() {
        return this.breakpoint >= ScreenBreakpoints.XS;
    }

    /** screen < 768 (ScreenBreakpoints.SM) */
    @computed get isScreenLessMedium() {
        return this.breakpoint < ScreenBreakpoints.SM;
    }

    /** screen >= 768 (ScreenBreakpoints.SM) */
    @computed get isScreenMedium() {
        return this.breakpoint >= ScreenBreakpoints.SM;
    }

    /** screen < 991 (ScreenBreakpoints.MD) */
    @computed get isScreenLessLarge(): boolean {
        return this.breakpoint < ScreenBreakpoints.MD;
    }

    /** screen >= 991 (ScreenBreakpoints.MD) */
    @computed get isScreenLarge() {
        return this.breakpoint >= ScreenBreakpoints.MD;
    }

    /** screen >= 1200 (ScreenBreakpoints.XL) */
    @computed get isScreenExtraLarge() {
        return this.breakpoint >= ScreenBreakpoints.XL;
    }

    @computed get deviceType(): SitecoreChannel {
        if (this.isScreenExtraLarge || this.isScreenLarge) {
            return SitecoreChannel.Desktop;
        }

        if (this.isScreenMedium) {
            return SitecoreChannel.Tablet;
        }

        return SitecoreChannel.Mobile;
    }

    @action private checkOrientation = () => {
        this.isLandscapeOrientation = window.innerHeight < window.innerWidth;
    };

    private resizeListener = debounce(() => {
        runInAction(() => {
            this.checkOrientation();
            this.breakpoint = window.innerWidth;
        });
    }, 300);

    @action setLoading = (loading: boolean) => (this.isLoading = loading);

    @action toggleOfferConditions = (state: boolean) => {
        this.showOfferConditions = state;

        if (this.showOfferConditions) {
            // Scroll to top of 'Offers conditions' block.
            // Use timeout, because the block should be expanded at first
            setTimeout(() => {
                scrollToOfferConditions(Anchor.OfferConditions);
            }, 0);
        }
    };

    @action hideMaintenancePopup = () => {
        this.wasMaintenancePopupShown = true;
    };

    @action setNavigationBooking = (state: boolean) => {
        this.isNavigationBooking = state;
    };

    @action setNotification = (data: any) => {
        this.notification = data || null;
    };

    @action setCookiesPopupWasShown = (state: boolean) => {
        this.isCookiesPopupWasShown = state;
    };

    @action setAmendBookingItemPayload = value => {
        this.amendBookingItemPayload = value;
    };
}

export default BaseAppStore;

import { action, computed, makeObservable, observable, toJS } from 'mobx';

import { getEnvAll } from 'code/env';
import { IAmendPaymentPayload } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { ExtraLuggage } from 'frontend/store/base/booking/ExtraLuggage';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { AmendmentType, IBookingInfo, IBookingInfoPayload } from 'models/data/IBookingInfo';
import { IRoom } from 'models/data/IHotel';
import { IRoute } from 'models/data/IRoute';
import { MarketCode } from 'models/data/MarketSettings';
import { BookingStatus } from 'models/enum/BookingStatus';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export interface IViewBookingPayload extends IBookingInfoPayload {
    amendPaymentPayload?: IAmendPaymentPayload;
    amendmentType?: Nullable<AmendmentType>;
    dimension66?: string;
    isBackToPageClicked?: boolean;
    paymentMethod?: string | null;
    rooms?: IRoom[];
    shouldOpenSeatMapForced?: boolean;
}

export interface IBaseViewBookingStoreInitialState {
    viewBookingPayload: Nullable<IViewBookingPayload>;
}

class BaseViewBookingStore implements ISssrStore<IBaseViewBookingStoreInitialState> {
    @observable booking: Nullable<IBookingInfo> = null;
    @observable viewBookingPayload: Nullable<IViewBookingPayload>;
    @observable isBookingCanceled: boolean = false;
    @observable isAmendErrorPopupShown: boolean = false;
    @observable isHelpPopupShown: boolean = false;
    @observable successfulAmendmentStatus: Nullable<AmendmentType> = null;

    @observable extraLuggage: ExtraLuggage;
    @observable refreshBookingPayloadFromStorage: Nullable<IBookingInfoPayload> = null;

    constructor(public rootStore: TRootStore) {
        this.extraLuggage = new ExtraLuggage(rootStore);

        makeObservable(this);
    }

    public serialize(): IBaseViewBookingStoreInitialState {
        return {
            viewBookingPayload: toJS(this.viewBookingPayload),
        };
    }

    public deserialize(initialState?: IBaseViewBookingStoreInitialState): void {
        if (initialState) {
            this.viewBookingPayload = initialState.viewBookingPayload;
        }
    }

    @computed get isB2BAmendmentAllowed(): boolean {
        return getEnvAll().B2B_AMENDMENTS_ENABLED;
    }

    @computed get isMicroAppManageMyHolidayAllowed(): boolean {
        return (
            !this.isLuxuryPackage &&
            getEnvAll().MANAGE_MY_HOLIDAY_ENABLED &&
            this.rootStore.marketStore.marketCode === MarketCode.UK
        );
    }

    @computed get isMicroAppAmendTransferAllowed(): boolean {
        return !this.isLuxuryPackage && getEnvAll().AMEND_TRANSFER_FLOW_ENABLED;
    }

    @computed get isMicroAppAmendFlightsAllowed(): boolean {
        return !this.isLuxuryPackage && getEnvAll().AMEND_FLIGHT_FLOW_ENABLED;
    }

    @computed get isMicroAppAmendDateAllowed(): boolean {
        return !this.isLuxuryPackage && getEnvAll().AMEND_DATE_FLOW_ENABLED;
    }

    @computed get isMicroAppAmendRoomAndBoardAllowed(): boolean {
        return !this.isLuxuryPackage && getEnvAll().AMEND_ROOM_AND_BOARD_FLOW_ENABLED;
    }

    @computed get isMicroAppAmendMultiRoomAndBoardAllowed(): boolean {
        return !this.isLuxuryPackage && getEnvAll().AMEND_MULTI_ROOM_AND_BOARD_FLOW_ENABLED;
    }

    @computed get isMicroAppAmendSeatsAllowed(): boolean {
        return !this.isLuxuryPackage && getEnvAll().AMEND_SEAT_FLOW_ENABLED;
    }

    @computed get isMicroAppAmendHotelAllowed(): boolean {
        return !this.isLuxuryPackage && getEnvAll().AMEND_HOTEL_FLOW_ENABLED;
    }

    @computed get isMicroAppAmendNameAllowed(): boolean {
        return !this.isLuxuryPackage && getEnvAll().AMEND_NAME_FLOW_ENABLED;
    }

    @computed get outboundFlight(): IRoute | undefined {
        return this.booking?.package?.transport?.routes?.[0];
    }

    @computed get inboundFlight(): IRoute | undefined {
        return this.booking?.package?.transport?.routes?.[1];
    }

    @computed get isFlightExternal(): boolean {
        return !!this.booking?.package?.transport?.routes[0]?.isExt;
    }

    @computed get outboundFlightNumber(): string {
        return getFlightDigitalNumber(this.outboundFlight);
    }

    @computed get inboundFlightNumber(): string {
        return getFlightDigitalNumber(this.inboundFlight);
    }

    @computed get isBookingOutOfSync(): boolean {
        return !!this.booking?.seatSelection?.find(flight => !flight.isSeatReservationPossible);
    }

    @action baseUpdateBookingInfo = (booking: Nullable<IBookingInfo>): void => {
        this.booking = booking;

        if (this.booking) {
            this.rootStore.flightsPassengersStore.setPassengersStore(this.booking);

            if (this.booking.seatSelection) {
                this.rootStore.seatMapStore.setValidatedSelectedSeats(this.booking.seatSelection);
            }

            if (this.booking.extraLuggageInfo) {
                this.extraLuggage.setExtraLuggageInfo(this.booking.extraLuggageInfo);
            }

            this.setRefreshBookingPayloadToStorage(this.booking);
        } else {
            this.rootStore.seatMapStore.clearValidatedSeats();
        }

        this.isBookingCanceled = booking?.bookingStatus === BookingStatus.Canceled;
    };

    @action toggleAmendErrorPopup = (state: boolean): void => {
        this.isAmendErrorPopupShown = state;
    };

    @action toggleHelpPopup = (state: boolean): void => {
        this.isHelpPopupShown = state;
    };

    @action setSuccessfulAmendmentStatus = (state: Nullable<AmendmentType>): void => {
        this.successfulAmendmentStatus = state;
    };

    @action readRefreshBookingPayloadFromStorage = (): void => {
        this.refreshBookingPayloadFromStorage = getWebStorageItem(WebStorageKeys.BookingPayload, true, sessionStorage);
    };

    setRefreshBookingPayloadToStorage = (booking: IBookingInfo): void => {
        setWebStorageItem(WebStorageKeys.BookingPayload, getBookingPayload(booking), sessionStorage);
    };

    @computed get isLuxuryPackage(): boolean {
        return containsLuxuryPromoCode(this.booking?.promoCollections || []);
    }

    @action clearViewBookingPayload = (): void => {
        this.viewBookingPayload = null;
    };
}

export default BaseViewBookingStore;

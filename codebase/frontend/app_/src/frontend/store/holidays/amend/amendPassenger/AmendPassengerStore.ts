import { AxiosError, AxiosResponse } from 'axios';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { webApiUrls } from 'code/endpoints';
import bookingService from 'frontend/services/booking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { hasIntersection } from 'frontend/utils/array.utils';
import { getBrowserInfo } from 'frontend/utils/payment.utls';
import { generateTransactionId } from 'frontend/utils/paymentTransaction';
import AxiosRequest from 'frontend/utils/request';
import { TAmendCTAState } from 'models/data/bookingAmendment/amendCTAState';
import { IGuestAmendPossibility } from 'models/data/GuestAmendPossibility';
import { GuestToEdit } from 'models/data/GuestToEdit';
import { IBookingInfo, TAmendPassengerRestrictions } from 'models/data/IBookingInfo';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import SiteSettings from 'models/enum/SiteSettings';

import { AMEND_PASSENGERS_DISABLED_STATUSES } from './constants';

export class AmendPassengerStore {
    @observable.ref booking: Nullable<IBookingInfo>;
    @observable guestsToEdit: GuestToEdit[];
    @observable guestAmendPossibilities: Nullable<IGuestAmendPossibility[]>;
    @observable isLoadingPassengers: boolean = false;
    @observable isSubmitPending: boolean;
    @observable isSuccessfullySubmitted: boolean;
    @observable nameChangeValidationError?: AxiosError['response'];
    @observable submitError?: AxiosError['response'];

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @action updateStoreBooking = (booking?: IBookingInfo) => {
        this.booking = booking;
    };

    @action initialize = async () => {
        const { routerStore } = this.rootStore;

        const bookingReference = this.booking?.bookingReference;

        if (!bookingReference) {
            routerStore.redirectToViewBookingsPage();

            return;
        }

        const guestsToEdit = this.rootStore.viewBookingStore.booking?.guests?.map(
            guest => new GuestToEdit(guest, bookingReference),
        );

        if (guestsToEdit?.length) {
            this.guestsToEdit = guestsToEdit;
        }

        this.isLoadingPassengers = true;

        await this.getPassengerEditPossibilities();

        if (this.guestAmendPossibilities?.length) {
            this.guestsToEdit = this.guestsToEdit?.map(guestToEdit => {
                const canChangeName =
                    this.guestAmendPossibilities?.find(({ paxId }) => guestToEdit.initialDetails.index === paxId)
                        ?.canBeChanged ?? true;

                return new GuestToEdit(guestToEdit.initialDetails, bookingReference, canChangeName);
            });
        }

        this.isLoadingPassengers = false;
    };

    @action clearStore = () => {
        this.guestsToEdit = [];
        this.guestAmendPossibilities = null;
        this.nameChangeValidationError = undefined;
        this.isLoadingPassengers = false;
        this.booking = null;
        this.isSubmitPending = false;
        this.isSuccessfullySubmitted = false;
        this.resetSubmitError();
    };

    @action startEditPassengerDetails = (booking: IBookingInfo) => {
        const { routerStore } = this.rootStore;

        this.updateStoreBooking(booking);
        routerStore.redirectToAmendPassengerPage();
    };

    @action resetSubmitError = () => {
        this.submitError = undefined;
    };

    @action submitChanges = async () => {
        const bookingReference = this.booking?.bookingReference;

        if (bookingReference) {
            const transactionId = generateTransactionId();

            const payBody: any = {
                browserInfo: {
                    ...getBrowserInfo(this.rootStore.layoutStore.lang),
                },
                bookingReference,
                lastName: this.rootStore.viewBookingStore.booking?.guests?.find(guest => guest.isLead)?.lastName,
                date: this.rootStore.viewBookingStore.booking?.package?.accom?.startDate,
                paymentInfo: { amount: 0 },
                passengers: this.guestsToEdit.map(guestToEdit => guestToEdit.editedDetails),
                deviceId: transactionId,
            };

            this.isSubmitPending = true;
            this.resetSubmitError();

            try {
                const { data } = await bookingService.amendCommitBooking(payBody, transactionId);

                /* Update the view booking store with the new booking info
                    so that changes are instantly reflected on the view booking page */
                const { booking } = this.rootStore.viewBookingStore;

                if (booking) {
                    this.rootStore.viewBookingStore.updateBookingInfo({
                        ...booking,
                        guests: data.guests,
                    });
                }

                runInAction(() => {
                    this.isSuccessfullySubmitted = true;
                });
            } catch (err) {
                runInAction(() => {
                    this.submitError = err.response ?? err;
                });
                // Reload booking to update error statuses
                this.rootStore.viewBookingStore.loadBooking(true);
            } finally {
                runInAction(() => {
                    this.isSubmitPending = false;
                });
            }
        }
    };

    checkForAmendPossibilities = async (): Promise<AxiosResponse<any>> =>
        AxiosRequest.post(webApiUrls.checkForNameChangePossibility(), {
            bookingReference: this?.booking?.bookingReference,
            guests: this.rootStore.viewBookingStore.booking?.guests,
        });

    getPassengerEditPossibilities = async () => {
        try {
            const response = await this.checkForAmendPossibilities();

            runInAction(() => {
                this.guestAmendPossibilities = response.data;
            });
        } catch (err) {
            runInAction(() => {
                this.nameChangeValidationError = err?.response ?? err;
            });
        }
    };

    @computed get amendCTAState(): TAmendCTAState {
        const {
            booking,
            hasInventoryError,
            isLeadLoggedIn,
            amendBookingStatuses,
            allowanceRestrictions: { byExternalAgency },
        } = this.rootStore.viewBookingStore;
        const { byOutOfSync, byDisruption, byAirportParking } = this.allowanceRestrictions;
        const { byFlightManifested } = this.rootStore.amendFlightsStore.allowanceRestrictions;

        if (byDisruption || byOutOfSync || byFlightManifested || byExternalAgency || byAirportParking) {
            return { isVisible: true, isDisabled: true };
        }

        if (!booking) {
            return { isVisible: false };
        }

        // Check if restrictions only by inventory error
        const hasOnlyInventoryError = !hasIntersection(
            booking.amendmentInfo?.amendBookingStatus.filter(
                code => code !== AmendBookingStatus.AmendPassengerDisabledByInventoryError,
            ),
            AMEND_PASSENGERS_DISABLED_STATUSES,
        );

        // If we have only inventory error, allow to see CTA, to show appropriate popup
        const disableOnlyByInventoryError = hasOnlyInventoryError && hasInventoryError;

        if (disableOnlyByInventoryError) {
            return { isVisible: true };
        }

        const amendPax = booking.amendmentInfo?.pax;
        const isAllowByPax = !!(amendPax?.amendAllow && amendPax?.amendNameOnly);

        if (isLeadLoggedIn && isAllowByPax) {
            return { isVisible: true };
        }

        if (!hasIntersection(amendBookingStatuses, AMEND_PASSENGERS_DISABLED_STATUSES)) {
            return { isVisible: true };
        }

        return { isVisible: false };
    }

    @computed get isAmendCTAVisible(): boolean {
        return this.amendCTAState.isVisible;
    }

    @computed get isAmendCTADisabled(): boolean {
        return !!this.amendCTAState?.isDisabled;
    }

    @computed get allowanceRestrictions(): TAmendPassengerRestrictions {
        const { amendBookingStatuses } = this.rootStore.viewBookingStore;

        return {
            byOutOfSync: amendBookingStatuses.includes(AmendBookingStatus.AmendPassengerDisabledByOutOfSync),
            byDisruption: amendBookingStatuses.includes(AmendBookingStatus.AmendPassengerDisabledByFlightDisruption),
            byAirportParking: amendBookingStatuses.includes(AmendBookingStatus.AmendPassengerDisabledByAirportParking),
        };
    }

    @computed get haveUnsavedChanges() {
        return this.guestsToEdit?.some(guest => guest.isEdited && !guest.isSelected);
    }

    @computed get isChangePassengersCountAllowed() {
        return this.rootStore.layoutStore.getSetting(SiteSettings.IsAmendPassengerChangeCountEnabled);
    }

    @computed get isShowRestrictionInfoEnabled() {
        return this.rootStore.layoutStore.getSetting(SiteSettings.IsRestrictionInfoEnabled);
    }

    @computed get amendPassengerNameCharacterCount() {
        return this.rootStore.layoutStore.getSetting(SiteSettings.AmendPassengerNameCharacterCount);
    }
}

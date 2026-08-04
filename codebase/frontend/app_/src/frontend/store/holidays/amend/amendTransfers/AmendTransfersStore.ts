import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { CurrencyCode } from 'code/currency';
import bookingService from 'frontend/services/booking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { hasIntersection } from 'frontend/utils/array.utils';
import { TAmendCTAState } from 'models/data/bookingAmendment/amendCTAState';
import { IAmendBookingPromoBreakDown } from 'models/data/IAmendBookingFlights';
import { TAmendTransferRestrictions } from 'models/data/IBookingInfo';
import { ITransfer, ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { DataStatus, isLoadedStatus } from 'models/enum/DataStatus';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';

import { getUpgradeTransferPrice } from './AmendTransfersStore.utils';
import { AMEND_TRANSFERS_DISABLED_STATUSES } from './constants';

export class AmendTransferStore {
    @observable transfersWithAmendmendCharges: ITransferWithAmendmentCharges[] = [];
    @observable selectedTransfer: Nullable<ITransferWithAmendmentCharges> = null;
    @observable prevSelectedTransfer: Nullable<ITransferWithAmendmentCharges>;
    @observable transferStatus: DataStatus = DataStatus.NotLoaded;
    @observable scenario = AmendScenarios.FromBooking;

    @observable isUnavailableTransferPopupShown = false;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @computed get currency(): CurrencyCode | undefined {
        return this.rootStore.viewBookingStore.booking?.currency?.code;
    }

    @computed get isNoAvailableTransfers(): boolean {
        return isLoadedStatus(this.transferStatus) && !this.transfersWithAmendmendCharges.length;
    }

    @computed get isAmendPriceEnabledOnViewBookingPage(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.IsAmendPriceEnabledOnViewBookingPage);
    }

    @computed get isAmendPriceEnabledOnChangeTransferPage(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.IsAmendPriceEnabledOnChangeTransferPage);
    }

    @computed get upgradePrice(): number {
        return getUpgradeTransferPrice(
            this.rootStore.viewBookingStore.booking?.transfers?.[0],
            this.transfersWithAmendmendCharges,
        );
    }

    @action setIsUnavailableTransferPopupShown = (value: boolean): void => {
        this.isUnavailableTransferPopupShown = value;
    };

    @action startToChangeTransferClick = () => {
        this.setScenario(AmendScenarios.FromBooking);

        return this.rootStore.routerStore.redirectToAmendTransferPage();
    };

    @action changeSelectedTransfer = (transfer: Nullable<ITransferWithAmendmentCharges>) => {
        this.selectedTransfer = transfer;
    };

    @action changePrevSelectedTransfer = (transfer: Nullable<ITransferWithAmendmentCharges>) => {
        this.prevSelectedTransfer = transfer;
    };

    @computed get allowanceRestrictions(): TAmendTransferRestrictions {
        const { amendBookingStatuses } = this.rootStore.viewBookingStore;

        return {
            byTimeBound: amendBookingStatuses.includes(AmendBookingStatus.AmendTransfersDisabledByTimeBound),
        };
    }

    @computed get amendCTAState(): TAmendCTAState {
        const {
            isLeadLoggedIn,
            allowanceRestrictions: { byLeadPassenger, byExternalAgency },
            hasBookingAtcomError,
            amendBookingStatuses,
            extraLuggage: { sportEquipmentNumber },
        } = this.rootStore.viewBookingStore;
        const { byTimeBound } = this.allowanceRestrictions;

        if (byTimeBound) {
            return { isVisible: false };
        }

        if (byExternalAgency || sportEquipmentNumber) {
            return { isVisible: true, isDisabled: true };
        }

        if (hasBookingAtcomError) {
            return { isVisible: false };
        }

        if (isLeadLoggedIn && this.isAmendTransferEligibleByAtcom) {
            return { isVisible: true };
        }

        if (byLeadPassenger && !hasIntersection(amendBookingStatuses, AMEND_TRANSFERS_DISABLED_STATUSES)) {
            return { isVisible: true };
        }

        return { isVisible: false };
    }

    @computed get isAmendCTADisabled(): boolean {
        return !!this.amendCTAState?.isDisabled;
    }

    @computed get isAmendCTAVisible(): boolean {
        return this.amendCTAState.isVisible;
    }

    @computed get isAmendTransferEligibleByAtcom(): boolean {
        return !!this.rootStore.viewBookingStore.booking?.amendmentInfo?.transfer?.amendAllow;
    }

    @action fetchAmendableAlternativeTransfers = async () => {
        const booking = this.rootStore.viewBookingStore.booking;

        if (!booking) return;

        this.transferStatus = DataStatus.Loading;

        try {
            const transfers = await bookingService.getAmendTransfersWithPrice(
                booking.bookingReference,
                booking.transfers[0].code,
                booking.package.accom,
                booking.package.transport,
            );

            runInAction(() => {
                this.transfersWithAmendmendCharges = transfers.filter(item => !!item);
                this.transferStatus = DataStatus.Loaded;
            });
        } catch (e) {
            runInAction(() => {
                this.transfersWithAmendmendCharges = [];
                this.transferStatus = DataStatus.Error;
            });
        }
    };

    @action clearStore = () => {
        this.scenario = AmendScenarios.FromBooking;
        this.rootStore.appStore.setAmendBookingItemPayload(undefined);
    };

    @action setScenario = (scenario: AmendScenarios) => {
        this.scenario = scenario;
    };

    @action initAmendTransfersPage = async () => {
        if (this.isFromBooking && this.rootStore.appStore.amendBookingItemPayload?.selectedTransfer) {
            this.initTransfersPageFromPayload();

            return;
        }

        if (this.isFromChangeDate) {
            this.transfersWithAmendmendCharges = this.rootStore.amendDatesStore.transfer.transfersWithAmendCharges;
        }

        this.redirectFromAmendTransfersPage();
    };

    // called when we have payload, i.e. page was called using POST from payment page
    @action initTransfersPageFromPayload = async () => {
        const {
            appStore: { amendBookingItemPayload },
            viewBookingStore,
        } = this.rootStore;

        await viewBookingStore.initBookingFromPayload(async () => {
            await this.fetchAmendableAlternativeTransfers();

            // select previously selected transfer
            if (amendBookingItemPayload?.selectedTransfer) {
                const transfer = this.transfersWithAmendmendCharges.find(
                    el => el.transfer.code === amendBookingItemPayload.selectedTransfer?.transfer.code,
                );

                if (transfer) {
                    this.changeSelectedTransfer(transfer);
                    this.changePrevSelectedTransfer(amendBookingItemPayload.selectedTransfer);
                }
            }
        });
    };

    @action redirectFromAmendTransfersPage = () => {
        if (!this.isAmendCTAVisible || !this.rootStore.viewBookingStore.booking) {
            const url =
                this.rootStore.layoutStore.getSetting(SiteSettings.AmendTransfersRedirectPage)?.value?.href ||
                SitePath.ViewBookings;

            this.rootStore.routerStore.redirectTo(url);
        }
    };

    @action resetAmendTransferStore = (fullReset = false) => {
        this.selectedTransfer = null;
        this.prevSelectedTransfer = null;

        if (fullReset) {
            this.transfersWithAmendmendCharges = [];
        }
    };

    @action submitTransfer = () => {
        if (this.isFromBooking) {
            return this.rootStore.viewBookingStore.continueToPay();
        }

        if (this.isFromChangeDate) {
            return this.rootStore.amendDatesStore.transfer.submitDateChangeTransferAmendment(
                this.selectedTransfer?.transfer,
            );
        }

        return this.rootStore.viewBookingStore.continueToPay();
    };

    @computed get isFromChangeDate(): boolean {
        return this.scenario === AmendScenarios.FromChangeDate;
    }

    @computed get isFromBooking(): boolean {
        return this.scenario === AmendScenarios.FromBooking;
    }

    @computed get initialSelectedTransfer(): ITransfer | undefined {
        if (this.isFromBooking) {
            return this.rootStore.viewBookingStore.booking?.transfers[0];
        }

        if (this.isFromChangeDate) {
            return this.rootStore.amendDatesStore.offer?.transfers[0];
        }

        return this.rootStore.viewBookingStore.booking?.transfers[0];
    }

    @computed get canLoadTransfers(): boolean {
        if (!this.rootStore.viewBookingStore.isLeadLoggedIn) {
            return false;
        }

        return this.isAmendCTAVisible && !this.isAmendCTADisabled;
    }

    @computed get totalPrice(): number {
        return this.selectedTransfer?.amendmentCharges ?? 0;
    }

    @computed get promocodeBreakdown(): IAmendBookingPromoBreakDown | undefined {
        return this.selectedTransfer?.promoCodeBreakDown;
    }
}

import Axios, { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { TRootStore } from 'frontend/store/IStores';
import { getSeatMapInfoFromSelectedSeats, handleUnchangedSeats } from 'frontend/utils/seatAndBags.utils';
import { IPassengerFlights } from 'models/data/AncillariesInfo';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';

export class BaseAmendSeatsStore {
    private cancelSource: Nullable<CancelTokenSource>;

    @observable newSelection: Nullable<ISelectedSeat[]> = null; // contains price difference instead of price
    @observable amendmentCharges: Nullable<number> = null;
    @observable paymentInfo: Nullable<IPaymentInfo>;
    @observable priceBreakdown: Nullable<IPriceBreakdownItem[]>;
    @observable tradeAgentPriceBreakdown: Nullable<IPriceBreakdownItem[]>;

    @observable private prevSelection: Nullable<ISelectedSeat[]> = null;
    @observable private guests: IGuestPassenger[] = [];
    @observable private outboundFlightNum: Nullable<string> = null;
    @observable private inboundFlightNum: Nullable<string> = null;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @computed get newSeatMapPassengers(): Nullable<IPassengerFlights[]> {
        if (
            !this.newSelection ||
            !this.prevSelection ||
            !this.guests ||
            !this.outboundFlightNum ||
            !this.inboundFlightNum
        ) {
            return null;
        }

        return handleUnchangedSeats(
            getSeatMapInfoFromSelectedSeats({
                guests: this.guests,
                seatSelection: this.newSelection,
                outboundFlightNum: this.outboundFlightNum,
                inboundFlightNum: this.inboundFlightNum,
            }),
            getSeatMapInfoFromSelectedSeats({
                guests: this.guests,
                seatSelection: this.prevSelection,
                outboundFlightNum: this.outboundFlightNum,
                inboundFlightNum: this.inboundFlightNum,
            }),
        );
    }

    @computed get prevSeatMapPassengers(): Nullable<IPassengerFlights[]> {
        if (!this.prevSelection || !this.guests || !this.outboundFlightNum || !this.inboundFlightNum) {
            return null;
        }

        return getSeatMapInfoFromSelectedSeats({
            guests: this.guests,
            seatSelection: this.prevSelection,
            outboundFlightNum: this.outboundFlightNum,
            inboundFlightNum: this.inboundFlightNum,
        });
    }

    @computed get totalPrice(): number {
        return this.amendmentCharges ?? 0;
    }

    @action confirmAmendment = async (
        seatSelection: ISelectedSeat[],
        onSuccess?: () => void,
        onError?: (e: any) => void,
    ): Promise<void> => {
        try {
            if (this.cancelSource) {
                this.cancelSource.cancel();
            }

            const booking = this.rootStore.viewBookingStore.booking;

            if (!booking) return;

            this.clearPayload();
            this.cancelSource = Axios.CancelToken.source();
            const res = await bookingService.getAmendSeats(booking.bookingReference, seatSelection, this.cancelSource);

            runInAction(() => {
                // these are used for payload in onSuccess callback
                this.newSelection = res.newSeatSelection;
                this.amendmentCharges = res.amendmentCharges;
                this.paymentInfo = res.paymentInfo;
                this.priceBreakdown = res.priceBreakdown;
                this.tradeAgentPriceBreakdown = res.tradeAgentPriceBreakdown;

                onSuccess?.();
            });
        } catch (e) {
            runInAction(() => {
                onError?.(e);
            });
        }
    };

    @action initFromPayload = (): void => {
        const { amendPaymentStore, routerStore } = this.rootStore;
        const { amendPaymentPayload, booking } = amendPaymentStore;

        if (!amendPaymentPayload) {
            routerStore.redirectToViewBookingsPage();

            return;
        }

        try {
            const selectedSeatsPayload = amendPaymentPayload?.selectedSeats;

            if (!selectedSeatsPayload) {
                routerStore.redirectToViewBookingsPage();

                return;
            }

            runInAction(() => {
                this.newSelection = selectedSeatsPayload.newSeatSelection;
                this.amendmentCharges = selectedSeatsPayload.amendmentCharges;
                this.prevSelection = selectedSeatsPayload.prevSeatSelection;
                this.guests = selectedSeatsPayload.guests;
                this.outboundFlightNum = selectedSeatsPayload.outboundFlightNum;
                this.inboundFlightNum = selectedSeatsPayload.inboundFlightNum;

                if (booking) {
                    this.rootStore.viewBookingStore.baseUpdateBookingInfo({
                        ...booking,
                        seatSelection: selectedSeatsPayload.newSeatSelection,
                    });
                }
            });
        } catch (e) {
            routerStore.redirectToViewBookingsPage();
        } finally {
            runInAction(() => this.clearPayload());
        }
    };

    @action private clearPayload = () => {
        this.rootStore.appStore.setAmendBookingItemPayload(undefined);
    };

    @action clearStore(): void {
        this.newSelection = null;
        this.prevSelection = null;
        this.outboundFlightNum = null;
        this.inboundFlightNum = null;
        this.guests = [];
    }
}

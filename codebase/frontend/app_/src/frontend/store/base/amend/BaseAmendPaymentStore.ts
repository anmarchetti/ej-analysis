import { computed, makeObservable, observable, toJS } from 'mobx';

import { CurrencyCode } from 'code/currency';
import { TRootStore } from 'frontend/store/IStores';
import { IAmendDatesResponseItem } from 'models/data/bookingAmendment/AmendDates';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IAmendRoomAndBoardOffer } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IBookingInfo, IBookingInfoPayload } from 'models/data/IBookingInfo';
import { ISelectedFilter } from 'models/data/IFilters';
import { IAmendSeatsPayload } from 'models/data/ISeatMapStore';
import { ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { BillingInfo } from 'models/data/payment/BillingInfo';

export interface IBaseAmendPaymentStore {
    amendPaymentPayload?: IAmendPaymentPayload;
}

export enum PaymentOption {
    Full = 'Full',
    Part = 'Part',
    AddToBalance = 'AddToBalance',
}

export enum RefundPaymentMethod {
    Balance = 'Balance',
    Credit = 'Credit',
    Original = 'Original',
    Unknown = 'Unknown',
}

export interface IAmendPaymentPayload extends IBookingInfoPayload {
    amendDatesOffer?: IAmendDatesResponseItem;
    amendHotelOffer?: IAmendHotelOffer;
    amendRoomAndBoardOffer?: IAmendRoomAndBoardOffer;
    billingInfo?: BillingInfo;
    isMultiroom?: boolean;
    perRoomRoomCharges?: number[];
    selectedFlight?: IAmendTransport;
    selectedFlightFilters?: ISelectedFilter[];
    selectedSeats?: IAmendSeatsPayload;
    selectedTransfer?: ITransferWithAmendmentCharges;
    totalAmendmentPrice?: number;
}

export class BaseAmendPaymentStore {
    @observable amendPaymentPayload: IAmendPaymentPayload | undefined;
    @observable.ref booking: Nullable<IBookingInfo>;
    @observable isPaying: boolean = false;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    public serialize(): IBaseAmendPaymentStore {
        return {
            amendPaymentPayload: toJS(this.amendPaymentPayload),
        };
    }

    public deserialize(initialState?: any): void {
        if (initialState) {
            this.amendPaymentPayload = initialState.amendPaymentPayload;
        }
    }

    @computed get currency(): CurrencyCode | undefined {
        return this.booking?.paymentInfo?.currency || this.booking?.currency?.code;
    }

    @computed get isFromAmendSeats() {
        return !!this.amendPaymentPayload?.selectedSeats || !!this.rootStore.amendSeatsStore.newSelection;
    }

    @computed get isFromAmendDates() {
        return !!this.amendPaymentPayload?.amendDatesOffer;
    }

    @computed get amountToPay(): number {
        const { amountToPay, usedCredit } = this.rootStore.payStore;

        return amountToPay + usedCredit;
    }

    @computed get balanceAmount(): number {
        return this.booking?.paymentInfo?.balanceDueAmount ?? 0;
    }
}

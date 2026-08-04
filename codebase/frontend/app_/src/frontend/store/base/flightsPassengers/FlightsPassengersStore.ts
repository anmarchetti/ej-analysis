import { action, computed, makeObservable, observable } from 'mobx';

import { TRootStore } from 'frontend/store/IStores';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import {
    getAdultsWithInfants,
    getAdultsWithoutInfants,
    getChildren,
    getPassengersWithAncillaries,
    getPassengersWithInfants,
} from 'frontend/utils/seatAndBags.utils';
import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ILuggageInfoItem } from 'models/data/IFlightExtras';
import { IValidatePackageInfo } from 'models/data/IValidPackageInfo';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';

export class FlightsPassengersStore {
    @observable public outBoundPassengers: IFlightPassenger[] = [];
    @observable public inBoundPassengers: IFlightPassenger[] = [];

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @computed get passengersByQueue(): IPassengerFlights[] {
        return [...this.adultsWithInfants, ...this.adultsWithoutInfants, ...this.children];
    }

    @computed private get adultsWithInfants(): IPassengerFlights[] {
        return getAdultsWithInfants(this.outBoundPassengers, this.inBoundPassengers);
    }

    @computed private get adultsWithoutInfants(): IPassengerFlights[] {
        return getAdultsWithoutInfants(this.outBoundPassengers, this.inBoundPassengers);
    }

    @computed get children(): IPassengerFlights[] {
        return getChildren(this.outBoundPassengers, this.inBoundPassengers);
    }

    @computed get adultsWithInfantsCount(): number {
        return this.adultsWithInfants.length;
    }

    @computed get adultsWithoutInfantsCount(): number {
        return this.adultsWithoutInfants.length;
    }

    @computed get childrenCount(): number {
        return this.children.length;
    }

    @computed get outboundFlightNumber(): string {
        const { seatMapStore } = this.rootStore;

        return getFlightDigitalNumber(seatMapStore.outboundFlight);
    }

    @computed get inboundFlightNumber(): string {
        const { seatMapStore } = this.rootStore;

        return getFlightDigitalNumber(seatMapStore.inboundFlight);
    }

    @action setPassengersStore = (data: IValidatePackageInfo | IBookingInfo): void => {
        if (!data.guests) {
            return;
        }

        const { guests } = data;
        const passengersIds = this.getPassengersIdsWithLCB(data.extraLuggageInfo?.items || []);

        const passengers: IFlightPassenger[] = getPassengersWithInfants(guests);

        this.outBoundPassengers = getPassengersWithAncillaries(
            passengers,
            data.seatSelection ?? [],
            this.outboundFlightNumber,
            passengersIds,
        );
        this.inBoundPassengers = getPassengersWithAncillaries(
            passengers,
            data.seatSelection ?? [],
            this.inboundFlightNumber,
            passengersIds,
        );
    };

    @action clearAllPassengersLCB = (): void => {
        this.inBoundPassengers.forEach(p => {
            p.hasLCB = false;
        });
        this.outBoundPassengers.forEach(p => {
            p.hasLCB = false;
        });
    };

    // lcb the same for outbound and return flight, so no matter which one we use
    get LCBCount(): number {
        return this.outBoundPassengers.filter(p => p.hasLCB).length;
    }

    //Check if all passengers that can have bag have it according to LCB availability
    @computed get isLCBAssignedToAllPassengers(): boolean {
        const passengersWithLCBCount = this.outBoundPassengers.reduce((sum, item) => (item.hasLCB ? sum + 1 : sum), 0);

        return (
            passengersWithLCBCount ===
            Math.min(
                this.rootStore.guestDetailsStore.adultsAndChildrenNumber,
                ...this.rootStore.bookingStore.extraLuggage.availableLCBQuantity,
            )
        );
    }

    private getPassengersIdsWithLCB = (data: ILuggageInfoItem[]): string[] =>
        data
            .filter(
                item =>
                    item.itemCode === this.rootStore.layoutStore.largeCabinBagCode &&
                    item.routeId === SeatMapFlightDirection.Outbound,
            )
            .map(bag => bag.passengerId);
}

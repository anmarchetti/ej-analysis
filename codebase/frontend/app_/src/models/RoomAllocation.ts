import { action, computed, makeObservable, observable } from 'mobx';

import {
    createAdultDetails,
    createChildDetails,
    createInfantDetails,
    isInfantsPerAdultQuantityReached,
    isInfantsPerAdultQuantityValid,
} from 'frontend/utils/guestsValidation';

import { GuestInfo } from './GuestInfo';

export const DEFAULT_AGE = 30;

export class RoomAllocation {
    constructor() {
        makeObservable(this);
    }

    id: number = Math.random();

    @observable adults: GuestInfo[] = [];
    @observable children: GuestInfo[] = [];
    @observable infants: GuestInfo[] = [];
    @observable roomCode: string | undefined;

    @action addAdult = (isTradePortal = false): void => {
        this.adults.push(createAdultDetails(DEFAULT_AGE, false, isTradePortal));
    };

    @action addChild = (age?: number): void => {
        this.children.push(createChildDetails(age));
    };

    @action addInfant = (): void => {
        this.infants.push(createInfantDetails());
    };

    @action removeAdult = (): void => {
        this.adults = this.adults.slice(0, -1);
    };

    @action removeChild = (): void => {
        this.children = this.children.slice(0, -1);
    };

    @action removeInfant = (): void => {
        this.infants = this.infants.slice(0, -1);
    };

    @action clearRoom = (isTradePortal: boolean): void => {
        this.adults = [];
        this.children = [];
        this.infants = [];
        this.adults.push(createAdultDetails(DEFAULT_AGE, false, isTradePortal));
        this.adults.push(createAdultDetails(DEFAULT_AGE, false, isTradePortal));
    };

    @action setRoomCode = (roomCode: string | undefined): void => {
        this.roomCode = roomCode;
    };

    @computed get totalCount(): number {
        return this.adults.length + this.children.length + this.infants.length;
    }

    @computed get isMinimumNumberOfAdults(): boolean {
        return this.adults.length <= 1;
    }

    @computed get isMinimumNumberOfAdultsForInfants(): boolean {
        return !isInfantsPerAdultQuantityValid(this.infants.length, this.adults.length - 1);
    }

    @computed get cantRemoveAdult(): boolean {
        return this.isMinimumNumberOfAdults || this.isMinimumNumberOfAdultsForInfants;
    }

    @computed get isMinimumNumberOfChildren(): boolean {
        return this.children.length <= 0;
    }

    @computed get cantRemoveChild(): boolean {
        return this.isMinimumNumberOfChildren;
    }

    @computed get isMaximumNumberOfInfantsForAdults(): boolean {
        return isInfantsPerAdultQuantityReached(this.infants.length, this.adults.length);
    }

    @computed get cantAddInfant(): boolean {
        return this.isMaximumNumberOfInfantsForAdults;
    }

    @computed get isMinimumNumberOfInfants(): boolean {
        return this.infants.length <= 0;
    }

    @computed get cantRemoveInfant(): boolean {
        return this.isMinimumNumberOfInfants;
    }

    @computed get isGuestsNumbersValid(): boolean {
        return this.adults.length >= 1 && isInfantsPerAdultQuantityValid(this.infants.length, this.adults.length);
    }
}

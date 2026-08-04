import { action, computed, makeObservable, observable } from 'mobx';

import { ILuggageTypes } from 'frontend/store/base/booking/ExtraLuggage';
import { areObjectsEqual } from 'frontend/utils/object.utils';
import { IHoldLuggageInfo } from 'models/data/IHoldLuggage';

export interface ILuggageSettings {
    largeSportEquipmentCategoryCode: string;
    maxNumberOfAdditionalLuggage: number;
    maxNumberOfLargeSportsEquipment: number;
    maxNumberOfSportEquipments: number;
}

interface IInitialHoldLuggagePopupState {
    selectedLuggage: IHoldLuggageInfo;
    selectedSportEquipment: IHoldLuggageInfo;
}

interface IInitializeHoldLuggageProps {
    adultsAndChildrenNumber: number;
    infantsNumber: number;
    luggagePrices: IHoldLuggageInfo;
    luggageTypes: ILuggageTypes;
    settings: ILuggageSettings;
    selectedLuggage?: IHoldLuggageInfo;
    selectedSportEquipment?: IHoldLuggageInfo;
}

export class HoldLuggageStore {
    @observable isHoldLuggagePopupOpened: boolean = false;
    @observable isCancelPopupOpened: boolean = false;
    @observable isHoldLuggageInitialized: boolean = false;
    @observable adultsAndChildrenNumber: number = 0;
    @observable infantsNumber: number = 0;
    @observable luggagePrices: IHoldLuggageInfo = {};
    @observable luggageTypes: ILuggageTypes = {};
    @observable initialState: IInitialHoldLuggagePopupState = {
        selectedLuggage: {},
        selectedSportEquipment: {},
    };

    // settings
    @observable.ref settings: ILuggageSettings = {
        largeSportEquipmentCategoryCode: '',
        maxNumberOfLargeSportsEquipment: 0,
        maxNumberOfAdditionalLuggage: 0,
        maxNumberOfSportEquipments: 0,
    };

    // hold luggage properties
    @observable.ref selectedLuggage: IHoldLuggageInfo = {};

    // sport equipment properties
    @observable.ref selectedSportEquipment: IHoldLuggageInfo = {};

    constructor() {
        makeObservable(this);
    }

    @action initializeHoldLuggage = ({
        luggageTypes,
        luggagePrices,
        adultsAndChildrenNumber,
        infantsNumber,
        selectedLuggage = {},
        selectedSportEquipment = {},
        settings,
    }: IInitializeHoldLuggageProps): void => {
        this.luggagePrices = luggagePrices;
        this.luggageTypes = luggageTypes;
        this.adultsAndChildrenNumber = adultsAndChildrenNumber;
        this.infantsNumber = infantsNumber;
        this.selectedLuggage = selectedLuggage;
        this.selectedSportEquipment = selectedSportEquipment;
        this.settings = settings;

        this.setInitialStateFromSelection();

        this.isHoldLuggageInitialized = true;
    };

    @action setInitialStateFromSelection = (): void => {
        this.initialState.selectedLuggage = { ...this.selectedLuggage };
        this.initialState.selectedSportEquipment = { ...this.selectedSportEquipment };
    };

    @action setHoldLuggagePopupOpened = (state: boolean): void => {
        this.isHoldLuggagePopupOpened = state;
    };

    @action setSportEquipment = (selectedEquipment: IHoldLuggageInfo): void => {
        this.selectedSportEquipment = selectedEquipment;
    };

    @action clearHoldLuggage = (): void => {
        this.selectedLuggage = {};
        this.selectedSportEquipment = {};
    };

    @action clearUnconfirmedLuggage = (): void => {
        this.selectedLuggage = this.initialState.selectedLuggage;
        this.selectedSportEquipment = this.initialState.selectedSportEquipment;
    };

    @action addBag = (bagId: string, isSport?: boolean): void => {
        const selected = isSport ? this.selectedSportEquipment : this.selectedLuggage;

        if (selected[bagId]) {
            selected[bagId] += 1;
        } else {
            selected[bagId] = 1;
        }

        if (isSport) {
            this.selectedSportEquipment = { ...selected };
        } else {
            this.selectedLuggage = { ...selected };
        }
    };

    @action removeBag = (bagId: string, isSport?: boolean): void => {
        const selected = isSport ? this.selectedSportEquipment : this.selectedLuggage;

        if (selected[bagId]) {
            selected[bagId] -= 1;
        }

        if (selected[bagId] === 0) {
            delete selected[bagId];
        }

        if (isSport) {
            this.selectedSportEquipment = { ...selected };
        } else {
            this.selectedLuggage = { ...selected };
        }
    };

    @computed get hasLuggageSelectionChanged(): boolean {
        return (
            !areObjectsEqual(this.initialState.selectedLuggage, this.selectedLuggage) ||
            !areObjectsEqual(this.initialState.selectedSportEquipment, this.selectedSportEquipment)
        );
    }

    @computed get isHoldLuggageFull(): boolean {
        return (
            (this.selectedLuggageNumber === this.maxNumberOfExtraLuggage && this.selectedLuggageNumber !== 0) ||
            (this.selectedSportEquipmentNumber === this.maxNumberOfEquipment && this.selectedSportEquipmentNumber !== 0)
        );
    }

    get maxNumberOfExtraLuggage(): number {
        return this.settings.maxNumberOfAdditionalLuggage * this.adultsAndChildrenNumber;
    }

    get maxNumberOfEquipment(): number {
        return this.settings.maxNumberOfSportEquipments * this.adultsAndChildrenNumber;
    }

    get selectedLuggageNumber(): number {
        return Object.values(this.selectedLuggage).reduce((acc, v) => acc + v, 0);
    }

    get selectedSportEquipmentNumber(): number {
        return Object.values(this.selectedSportEquipment).reduce((acc, v) => acc + v, 0);
    }

    get selectedTotalNumber(): number {
        return this.selectedLuggageNumber + this.selectedSportEquipmentNumber;
    }

    get selectedLuggagePrice(): number {
        let total = 0;

        for (const [bagType, selectedNumber] of Object.entries(this.selectedLuggage)) {
            total += this.luggagePrices[bagType] * selectedNumber;
        }

        return total;
    }

    get selectedSportEquipmentPrice(): number {
        let total = 0;

        for (const [bagType, selectedNumber] of Object.entries(this.selectedSportEquipment)) {
            total += this.luggagePrices[bagType] * selectedNumber;
        }

        return total;
    }

    get selectedLuggageTotalPrice(): number {
        return this.selectedLuggagePrice + this.selectedSportEquipmentPrice;
    }

    @action setCancelPopupOpened = (state: boolean): void => {
        this.isCancelPopupOpened = state;
    };

    @computed get selectedLargeEquipmentNumber(): number {
        return Object.entries(this.selectedSportEquipment).reduce(
            (sum, [code, quantity]) => (this.isEquipmentLarge(code) ? sum + quantity : sum),
            0,
        );
    }

    isEquipmentLarge = (code: string): boolean =>
        this.luggageTypes[code].categoryCode === this.settings.largeSportEquipmentCategoryCode;

    isAddLuggageBtnDisabled = (isSport: boolean, code: string): boolean => {
        let isDisabled;

        if (isSport) {
            isDisabled = this.selectedSportEquipmentNumber >= this.maxNumberOfEquipment;
            const { largeSportEquipmentCategoryCode, maxNumberOfLargeSportsEquipment } = this.settings;
            const isLargeSport = this.luggageTypes[code].categoryCode === largeSportEquipmentCategoryCode;

            if (!isDisabled && isLargeSport) {
                // impossible to add more that 6 large sport equipments to one booking
                isDisabled = this.selectedLargeEquipmentNumber >= maxNumberOfLargeSportsEquipment;
            }
        } else {
            isDisabled = this.selectedLuggageNumber >= this.maxNumberOfExtraLuggage;
        }

        return isDisabled;
    };

    isRemoveLuggageBtnDisabled = (isSport: boolean, code: string): boolean => {
        const selectedItems = isSport ? this.selectedSportEquipment : this.selectedLuggage;

        return !selectedItems[code];
    };
}

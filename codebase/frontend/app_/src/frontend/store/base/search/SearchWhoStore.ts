import { action, computed, makeObservable, observable } from 'mobx';

import settings from 'code/settings';
import { BaseQueryParamsGetters } from 'frontend/store/base/queryParams/BaseQueryParamsGetters';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { getNumberOfGuestsByCategory, validateChildrenAgesInRoom } from 'frontend/utils/guestsValidation';
import { isDefined } from 'frontend/utils/object.utils';
import {
    cloneRoomAllocationArray,
    getRoomAllocationFromQueryRoom,
    getWhoField,
} from 'frontend/utils/search/search.utils';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { QueryParamName } from 'models/enum/QueryParamName';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { RoomAllocation } from 'models/RoomAllocation';
import {
    adjustRooms,
    filterRoomsById,
    getAdultsQuantity,
    getChildrenQuantity,
    getInfantsQuantity,
    isDefaultAmountPassengersInRooms,
    isRoomAllocationNonStandard,
} from 'models/RoomAllocation.utils';

export const DEFAULT_DATE = 3;
export const RANGE_DURATION_IN_MONTHS = 3;
export const MAX_REQUEST_COUNT = 3;
export const AUTO_ALLOCATION_SITECORE_VALUE = -1;

export interface ISearchWhoInitialState {
    isAutoAllocation?: boolean;
    roomsAllocation?: RoomAllocation[];
}

export interface ISearchWhoStore {
    adultsQuantity: number;
    allocateManyRooms: (hard?: boolean) => void;
    childrenAges: number[];
    childrenQuantity: number;
    defaultIsAutoAllocation: boolean;
    deserialize: (initialState?: ISearchWhoInitialState) => void;
    handleWhoQueryParams: (changedQuery: { [key: string]: boolean }, queryGetter: BaseQueryParamsGetters) => void;
    infantsQuantity: number;
    isAutoAllocation: boolean;
    isChildrenAgeValid: boolean;
    isDefaultNumberGuestsInRooms: boolean;
    isGuestsParametersValid: boolean;
    isKidsGoFree: boolean;
    isTotalGuestQuantityValid: boolean;
    isTotalGuestsQuantityReached: boolean;
    isWhoParamsValid: boolean;
    maxNumberOfGuests: number;
    maxNumberOfGuestsPerRoom: number;
    mergeRoomsIntoOne: () => void;
    onChangeRooms: (rooms: number) => boolean;
    onClearRoom: () => void;
    onRemoveRoom: (id: number) => void;
    resetRoomAllocation: () => void;
    roomsAllocation: RoomAllocation[];
    roomsAllocationLength: number;
    serialize: () => ISearchWhoInitialState;
    setIsAutoAllocation: (state: boolean) => void;
    setIsAutoAllocationToDefaultValue: () => void;
    setMaxGuestNumberError: () => void;
    setMaxGuestNumberPerRoomError: () => void;
    setRoomsAllocation: (rooms: RoomAllocation[]) => void;
    totalGuestsQuantity: number;
    totalPaidGuestPlaces: number;
    updateRoomsAllocationFromQueryParamsStore: (forceQuery: boolean) => void;
    validateChildrenAge: () => boolean;
    validateGuestQuantity: () => boolean;
    validateGuestQuantityPerRoom: (room: RoomAllocation) => boolean;
    whoValue: string;
}

export class SearchWhoStore implements ISssrStore<ISearchWhoInitialState> {
    @observable public isAutoAllocation: boolean;
    @observable public roomsAllocation: RoomAllocation[] = [new RoomAllocation()];
    @observable public isKidsGoFree: boolean = false;
    @observable public isChildrenAgeValid: boolean = true;

    constructor(private readonly rootStore: TRootStore) {
        makeObservable(this);

        this.addDefaultGuestsValues();
    }

    serialize = (): ISearchWhoInitialState => ({
        roomsAllocation: this.roomsAllocation,
        isAutoAllocation: this.isAutoAllocation,
    });

    deserialize = (initialState?: ISearchWhoInitialState): void => {
        if (!initialState) {
            return;
        }

        this.isAutoAllocation = !!initialState.isAutoAllocation;

        if (initialState.roomsAllocation) {
            const roomsAllocation: RoomAllocation[] = cloneRoomAllocationArray(
                initialState.roomsAllocation,
                this.rootStore.layoutStore.isTradePortal,
            );

            this.setRoomsAllocation(roomsAllocation);
        }
    };

    get whoValue(): string {
        return getWhoField(
            {
                adults: this.adultsQuantity,
                children: this.childrenQuantity,
                infants: this.infantsQuantity,
            },
            this.roomsAllocationLength,
            this.isAutoAllocation,
            this.rootStore.layoutStore.getPhrase,
            this.childrenAges,
            this.rootStore.layoutStore.isPromoPage,
        );
    }

    get whoValueOnlyGuests(): string {
        const adults = this.adultsQuantity;
        const children = this.childrenQuantity;
        const infants = this.infantsQuantity;
        const getPhrase = this.rootStore.layoutStore.getPhrase;

        return getNumberOfGuestsByCategory(getPhrase, adults, children, infants);
    }

    get isDefaultNumberGuestsInRooms(): boolean {
        const isRoomNonStandard = isRoomAllocationNonStandard(this.roomsAllocation);

        if (!this.defaultRoomNumber) {
            return !isRoomNonStandard && !this.isAutoAllocation;
        }

        if (this.defaultRoomNumber > 1) {
            if (
                this.roomsAllocationLength !== this.defaultRoomNumber ||
                this.isAutoAllocation ||
                !isDefaultAmountPassengersInRooms(this.roomsAllocation)
            ) {
                return false;
            }
        } else if (
            isRoomNonStandard ||
            (this.defaultRoomNumber === -1 && !this.isAutoAllocation) ||
            (this.defaultRoomNumber > -1 && this.isAutoAllocation)
        ) {
            return false;
        }

        return true;
    }

    @computed get isWhoParamsValid(): boolean {
        return (
            this.isTotalGuestQuantityValid &&
            this.isGuestQuantityPerRoomValid &&
            !this.roomsAllocation.find(room => !!validateChildrenAgesInRoom(room.children))
        );
    }

    @computed get roomsAllocationLength(): number {
        return this.roomsAllocation.length;
    }

    @computed get defaultIsAutoAllocation(): boolean {
        return this.defaultRoomNumber === AUTO_ALLOCATION_SITECORE_VALUE;
    }

    @computed get adultsQuantity(): number {
        return getAdultsQuantity(this.roomsAllocation);
    }

    @computed get childrenQuantity(): number {
        return getChildrenQuantity(this.roomsAllocation);
    }

    @computed get infantsQuantity(): number {
        return getInfantsQuantity(this.roomsAllocation);
    }

    @computed get totalGuestsQuantity(): number {
        return this.adultsQuantity + this.childrenQuantity + this.infantsQuantity;
    }

    @computed get childrenAges(): number[] {
        const ages: number[] = [];

        this.roomsAllocation.forEach(room => room.children.forEach(child => ages.push(child.age)));

        return ages;
    }

    /**
     * Validating guests quantity
     */

    @computed get maxNumberOfGuests(): number {
        return this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.MaxNumberOfGuests);
    }

    @computed get maxNumberOfGuestsPerRoom(): number {
        return this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.MaxNumberOfGuestsPerRoom);
    }

    @computed get isTotalGuestsQuantityReached(): boolean {
        return this.totalGuestsQuantity === this.maxNumberOfGuests;
    }

    @computed get isTotalGuestQuantityValid(): boolean {
        return this.totalGuestsQuantity <= this.maxNumberOfGuests;
    }

    validateGuestQuantityPerRoom = (room: RoomAllocation): boolean => {
        if (room.totalCount >= this.maxNumberOfGuestsPerRoom) {
            return true;
        }

        return false;
    };

    @computed private get isGuestQuantityPerRoomValid(): boolean {
        return this.roomsAllocation.every(room => room.totalCount <= this.maxNumberOfGuestsPerRoom);
    }

    @computed get isGuestsParametersValid(): boolean {
        return this.isTotalGuestQuantityValid && this.isGuestQuantityPerRoomValid && this.isChildrenAgeValid;
    }

    /**
     * Get total number of paid places. (Children can go free, infants places always are free)
     */
    @computed get totalPaidGuestPlaces(): number {
        return this.adultsQuantity + (this.isKidsGoFree ? 0 : this.childrenQuantity);
    }

    @action setIsAutoAllocation = (state: boolean): void => {
        this.isAutoAllocation = state;
    };

    @action setIsAutoAllocationToDefaultValue = (): void => {
        this.setIsAutoAllocation(this.defaultIsAutoAllocation);
    };

    @action private readonly addDefaultGuestsValues = (): void => {
        const defaultNumberOfAdultsInFirstRoom = settings.RoomAllocation.AdultsInFirstRoom;

        if (this.roomsAllocationLength > 0) {
            for (let i = 0; i < defaultNumberOfAdultsInFirstRoom; i++) {
                this.roomsAllocation[0].addAdult(this.rootStore.layoutStore.isTradePortal);
            }
        }
    };

    @action resetRoomAllocation = (): void => {
        this.setRoomsAllocation([new RoomAllocation()]);
        this.addDefaultGuestsValues();
    };

    @action allocateManyRooms = (hard?: boolean): void => {
        const roomsAllocation: RoomAllocation[] = [];

        if (!this.rootStore.layoutStore.isHomePage && !hard) {
            roomsAllocation.push(new RoomAllocation());
            roomsAllocation[0].addAdult(this.rootStore.layoutStore.isTradePortal);
            roomsAllocation[0].addAdult(this.rootStore.layoutStore.isTradePortal);

            // TO DO investigate why roomsAllocation doesn't set
            return;
        }

        this.setIsAutoAllocationToDefaultValue();

        if (!this.defaultRoomNumber || this.defaultRoomNumber <= 1) {
            roomsAllocation.push(new RoomAllocation());
            roomsAllocation[0].addAdult(this.rootStore.layoutStore.isTradePortal);
            roomsAllocation[0].addAdult(this.rootStore.layoutStore.isTradePortal);
        } else {
            for (let i = 0; i < this.defaultRoomNumber; i++) {
                roomsAllocation.push(new RoomAllocation());
                roomsAllocation[i].addAdult(this.rootStore.layoutStore.isTradePortal);
            }
        }

        this.setRoomsAllocation(roomsAllocation);
        this.validateChildrenAge();
    };

    @action setMaxGuestNumberError = (): void => {
        this.rootStore.searchStore.errorMessages = {
            key: SearchBarDropdown.Who,
            message: SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
        };
    };

    @action setMaxGuestNumberPerRoomError = (): void => {
        this.rootStore.searchStore.errorMessages = {
            key: SearchBarDropdown.Who,
            message: SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
        };
    };

    @action validateGuestQuantity = (): boolean => {
        if (!this.isTotalGuestQuantityValid) {
            this.setMaxGuestNumberError();

            return true;
        }

        if (!this.isGuestQuantityPerRoomValid) {
            this.setMaxGuestNumberPerRoomError();

            return true;
        }

        this.rootStore.searchStore.clearErrorMessage();

        return false;
    };

    @action validateChildrenAge = (): boolean => {
        this.isChildrenAgeValid = !this.roomsAllocation.find(room => !!validateChildrenAgesInRoom(room.children));

        return this.isChildrenAgeValid;
    };

    /**
     * Change total number of rooms
     */
    @action onChangeRooms = (_rooms: number): boolean => {
        let rooms = _rooms;

        if (_rooms === -1) {
            this.setIsAutoAllocation(true);
            rooms = 1;
        } else {
            this.setIsAutoAllocation(false);
        }

        const delta = rooms - this.roomsAllocationLength;

        if (delta === 0) {
            return true;
        }

        this.setRoomsAllocation(adjustRooms(this.roomsAllocation, delta));

        return !this.validateGuestQuantity();
    };

    @action onRemoveRoom = (id: number): void => {
        this.setRoomsAllocation(filterRoomsById(this.roomsAllocation, id));
    };

    @action onClearRoom = (): void => {
        if (!this.defaultRoomNumber) {
            this.onChangeRooms(1);
            this.roomsAllocation[0].clearRoom(this.rootStore.layoutStore.isTradePortal);
        } else {
            this.allocateManyRooms(true);
        }
    };

    @action setRoomsAllocation = (rooms: RoomAllocation[]): void => {
        this.roomsAllocation = rooms;
    };

    /* Create one room that contains all guests and set auto allocation */
    @action mergeRoomsIntoOne = (): void => {
        const room = new RoomAllocation();

        this.roomsAllocation.forEach(r => {
            room.adults.push(...r.adults);
            room.children.push(...r.children);
            room.infants.push(...r.infants);
        });

        this.setRoomsAllocation([room]);
        this.setIsAutoAllocation(true);
    };

    @action handleWhoQueryParams = (
        changedQuery: { [key: string]: boolean },
        queryGetter: BaseQueryParamsGetters,
    ): void => {
        const { roomsAllocationFromUrl, isAutoAllocationFromUrl } = queryGetter;

        if (changedQuery[QueryParamName.Rooms]) {
            this.applyRoomsAllocationFromUrl(roomsAllocationFromUrl);
        }

        if (changedQuery[QueryParamName.AutoAllocation]) {
            this.setIsAutoAllocation(!!isAutoAllocationFromUrl);
        }
    };

    @action updateRoomsAllocationFromQueryParamsStore = (forceQuery: boolean): void => {
        const { roomsAllocationFromUrl, isAutoAllocationFromUrl } = this.rootStore.queryParamsStore;
        const newIsAutoAllocation = (forceQuery ? undefined : this.isAutoAllocation) ?? isAutoAllocationFromUrl;

        if (isDefined(newIsAutoAllocation)) {
            this.setIsAutoAllocation(newIsAutoAllocation);
        } else {
            this.setIsAutoAllocationToDefaultValue();
        }

        this.applyRoomsAllocationFromUrl(roomsAllocationFromUrl);
    };

    @action private readonly applyRoomsAllocationFromUrl = (roomsAllocationFromUrl: IQueryRoom[]): void => {
        if (roomsAllocationFromUrl.length === 0) {
            return;
        }

        const newRoomsAllocation = roomsAllocationFromUrl.map(el =>
            getRoomAllocationFromQueryRoom(el, this.rootStore.layoutStore.isTradePortal),
        );

        this.setRoomsAllocation(newRoomsAllocation); // TO DO investigate if we can get rid of setRoomsAllocation call in case of a future resetRoomAllocation call

        const isThereInvalidRoomAllocation = this.roomsAllocation.some(room => !room.isGuestsNumbersValid);
        const needToResetToDefault =
            !this.isTotalGuestQuantityValid || !this.isGuestQuantityPerRoomValid || isThereInvalidRoomAllocation;

        if (needToResetToDefault) {
            this.resetRoomAllocation();
        }
    };

    /**
     * Default number of rooms from sitecore setting. -1 for auto-allocation (i.e. "I don't mind" option)
     */
    private get defaultRoomNumber(): number | null {
        const sitecoreValue = this.rootStore.layoutStore.getSetting(SiteSettings.DefaultRoomNumber);
        const number = parseInt(sitecoreValue);

        return !isNaN(number) ? number : null;
    }
}

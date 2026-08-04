import { action, computed, makeObservable, observable, toJS } from 'mobx';

import { Tokens } from 'code/tokens';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { createAdultDetails, createChildDetails, createInfantDetails } from 'frontend/utils/guestsValidation';
import isBackend from 'frontend/utils/isBackend';
import { getSingleRoute } from 'frontend/utils/route.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IValidationError } from 'models/data/validation/IValidationError';
import { GuestType } from 'models/enum/GuestType';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { GuestInfo } from 'models/GuestInfo';

export interface IGuestDetailsStoreInitialState {
    guestsDetails: GuestInfo[];
}

const GUESTS_HEADERS: Record<GuestType, SitecoreDictionary> = {
    [GuestType.Adult]: SitecoreDictionary.GuestDetailsSectionHeadersAdult,
    [GuestType.Child]: SitecoreDictionary.GuestDetailsSectionHeadersChild,
    [GuestType.Infant]: SitecoreDictionary.GuestDetailsSectionHeadersInfant,
};

class BaseGuestDetailsStore implements ISssrStore<IGuestDetailsStoreInitialState> {
    @observable guestsDetails: GuestInfo[] = [];
    @observable forceErrors: boolean = false;
    @observable confirmPolicy = false;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    serialize() {
        return { guestsDetails: toJS(this.guestsDetails) };
    }

    deserialize(initialState) {
        if (initialState) {
            this.guestsDetails = initialState.guestsDetails;
        }
    }

    @computed get adults(): GuestInfo[] {
        return (this.guestsDetails || []).filter(el => el.type === GuestType.Adult);
    }

    @computed get children(): GuestInfo[] {
        return (this.guestsDetails || []).filter(el => el.type === GuestType.Child);
    }

    @computed get infants(): GuestInfo[] {
        return (this.guestsDetails || []).filter(el => el.type === GuestType.Infant);
    }

    @computed get leadPassenger(): Nullable<GuestInfo> {
        return this.adults.find(el => el.isLead);
    }

    @computed get leadSurname(): string {
        return this.leadPassenger?.lastName || '';
    }

    @computed get holidayStartDate() {
        const offer = this.rootStore.bookingStore.selectedOffer;

        if (offer) {
            const routes = offer.transport.routes.filter(el => el.direction === RouteDirection.Inbound);
            const route = getSingleRoute(routes, true);
            const date = route ? route.arrDate : offer.date;

            return new Date(date);
        }

        return new Date();
    }

    @computed get shouldConfirmPolicy() {
        return this.forceErrors && this.confirmPolicy === false;
    }

    @computed get guestDetailsErrors(): IValidationError[] {
        const isTradePortal = this.rootStore.layoutStore.isTradePortal;
        const errors: IValidationError[] = [];

        this.guestsDetails.forEach(el => {
            errors.push(...el.getErrorsBySiteName(isTradePortal));
        });

        return errors;
    }

    @action toggleForceErrors = (state: boolean) => {
        this.forceErrors = state;
    };

    @action toggleConfirmPolicy = () => {
        this.confirmPolicy = !this.confirmPolicy;
    };

    @action clearGuestDetails = () => {
        this.guestsDetails = [];
    };

    @action createGuestsDetails = (force: boolean = false) => {
        if (this.guestsDetails.length === 0 || force) {
            const { isTradePortal } = this.rootStore.layoutStore;
            const result: GuestInfo[] = [];

            this.rootStore.searchStore.searchWho.roomsAllocation.forEach((room, j) => {
                for (let i = 0; i < room.adults.length; i++) {
                    result.push(createAdultDetails(room.adults[i].age, j === 0 && i === 0, isTradePortal));
                }
                for (let i = 0; i < room.children.length; i++) {
                    result.push(createChildDetails(room.children[i].age));
                }
                for (let i = 0; i < room.infants.length; i++) {
                    result.push(createInfantDetails(room.infants[i].age));
                }
            });
            result.forEach(el => (el.holidayStartDate = this.holidayStartDate));
            this.guestsDetails = result;
        }
    };

    public getSecondarySectionText = (details: GuestInfo): string => {
        const { getPhrase } = this.rootStore.layoutStore;

        if (details.isLead) {
            return `(${getPhrase(SitecoreDictionary.GuestDetailsSectionHeadersLeadGuest)})`;
        }

        if (details.type === GuestType.Child && details.age) {
            return `(${Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.GuestDetailsSectionHeadersChildAge),
                Tokens.Number,
                String(details.age),
            )})`;
        }

        return '';
    };

    public getPrimarySectionText = (details: GuestInfo): string =>
        this.rootStore.layoutStore.getPhrase(GUESTS_HEADERS[details.type]);

    public getGuestDetailsFromSessionStorage = (): GuestInfo[] => {
        const sessionItem = sessionStorage.getItem(WebStorageKeys.GuestDetailsSession);
        const guests = sessionItem ? JSON.parse(sessionItem) : [];

        return Array.isArray(guests) ? guests : [];
    };

    public hasGuestInStorage = (): boolean => {
        if (isBackend()) {
            return false;
        }

        const guests = this.getGuestDetailsFromSessionStorage();

        return guests.length > 0;
    };

    public getLeadEmailFromSessionStorage = () => {
        const guests = this.getGuestDetailsFromSessionStorage();
        const lead = guests.find(el => el.isLead);

        return lead?.email;
    };

    public saveGuestDetailsToSessionStorage = () => {
        if (this.guestsDetails.length > 0) {
            sessionStorage.setItem(WebStorageKeys.GuestDetailsSession, JSON.stringify(this.guestsDetails));
        }
    };

    public removeGuestDetailsFromSessionStorage = () => {
        sessionStorage.removeItem(WebStorageKeys.GuestDetailsSession);
    };

    @action updateGuestsDetailsWithSessionData() {
        const sessionGuestsDetails = this.getGuestDetailsFromSessionStorage();

        if (this.guestsDetails.length === 0 || sessionGuestsDetails.length === 0) {
            return;
        }

        Object.keys(GuestType).forEach(key => {
            const guestType = GuestType[key];
            const guests = (this.guestsDetails || []).filter(el => el.type === guestType);
            const sessionGuests = sessionGuestsDetails.filter(el => el.type === guestType);

            if (guestType === GuestType.Child) {
                this.updateChildrenWithSessionData(guests, sessionGuests);
            } else {
                for (let i = 0; i < guests.length && i < sessionGuests.length; i++) {
                    guests[i].updateFields(sessionGuests[i]);
                }
            }
        });
    }

    @action updateChildrenWithSessionData(guests: GuestInfo[], sessionGuests: GuestInfo[]) {
        for (let i = 0; i < guests.length && sessionGuests.length > 0; i++) {
            // Update child only if searched child age is the same as child age in session data
            const childAge = guests[i].age;
            const sessionChildIndex = sessionGuests.findIndex(ch => ch.age === childAge);

            if (sessionChildIndex !== -1) {
                guests[i].updateFields(sessionGuests[sessionChildIndex]);
                sessionGuests.splice(sessionChildIndex, 1);
            }
        }
    }

    loadReferenceData = async () =>
        Promise.all([
            this.rootStore.appCatalogStore.countries.fetchData(),
            this.rootStore.appCatalogStore.dialingCodes.fetchData(),
        ]);

    @computed get adultsAndChildrenNumber() {
        return this.adults.length + this.children.length;
    }
}

export default BaseGuestDetailsStore;

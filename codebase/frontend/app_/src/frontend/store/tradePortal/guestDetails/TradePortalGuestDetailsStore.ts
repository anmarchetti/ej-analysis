import { action, makeObservable } from 'mobx';

import BaseGuestDetailsStore from 'frontend/store/base/guestDetails/BaseGuestDetailsStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { IValidationError } from 'models/data/validation/IValidationError';

class TradePortalGuestDetailsStore extends BaseGuestDetailsStore {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    get formErrors(): IValidationError[] {
        return [...this.guestDetailsErrors];
    }

    get isFormValid(): boolean {
        return this.formErrors.length === 0 && this.confirmPolicy;
    }

    // Initialize on mounting <GuestDetails />
    @action initialize = () => {
        this.cleanUpGuestDetails();
        this.initializeGuests();
        this.loadReferenceData();
    };

    @action initializeGuests = () => {
        this.createGuestsDetails();
        this.updateGuestsDetailsWithSessionData();
    };

    @action cleanUpGuestDetails = () => {
        this.confirmPolicy = false;
        this.forceErrors = false;
    };

    @action onSelectContinue = () => {
        this.saveGuestDetailsToSessionStorage();
        this.rootStore.routerStore.redirectToConfirmPage();
    };
}

export default TradePortalGuestDetailsStore;

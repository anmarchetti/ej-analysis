import { action, makeObservable, observable, when } from 'mobx';

import { ISssrStore, TRootStore } from 'frontend/store/IStores';

export interface IUserStoreInitialState {
    redirectUrlLocal: string;
}

export class BaseUserStore implements ISssrStore<IUserStoreInitialState> {
    @observable isLoggedIn = false;
    @observable isGettingUserStatus: boolean = false;
    @observable isLoggingIn: boolean = false;
    @observable isLoggingOut: boolean = false;

    public redirectUrlLocal: string = '';

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    serialize() {
        return { redirectUrlLocal: this.redirectUrlLocal };
    }

    deserialize(initialState?: IUserStoreInitialState) {
        if (initialState) {
            this.redirectUrlLocal = initialState.redirectUrlLocal;
        }
    }

    @action setIsLoggedIn = (value: boolean) => {
        this.rootStore.engageStore.sendIdentityEvent();
        this.isLoggedIn = value;
    };

    @action setIsLoggingIn = (value: boolean) => {
        this.isLoggingIn = value;
    };

    @action setIsLoggingOut = (value: boolean) => {
        this.isLoggingOut = value;
    };

    @action setIsGettingUserStatus = (value: boolean) => {
        this.isGettingUserStatus = value;
    };

    setRedirectUrl = (url: string) => {
        this.redirectUrlLocal = url;
    };

    getUserStoreParamsFromQueryParamsStore = () => {
        this.redirectUrlLocal = this.rootStore.queryParamsStore.redirectUrlFromUrl || this.redirectUrlLocal;
    };

    // check if user is logged in, useful to check whether we should render or not
    checkIfUserLoggedIn = async (): Promise<boolean> => {
        // if loggedIn, just return true
        if (this.isLoggedIn) {
            return this.isLoggedIn;
        }

        return await new Promise(resolve => {
            // we add timeout to be sure that setUserLoggedIn runs first
            setTimeout(async () => {
                if (this.isGettingUserStatus) {
                    await when(() => this.isGettingUserStatus === false);
                }

                resolve(this.isLoggedIn);
            }, 1);
        });
    };
}

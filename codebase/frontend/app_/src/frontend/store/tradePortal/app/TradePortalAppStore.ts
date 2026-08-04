import { action, makeObservable, observable } from 'mobx';

import BaseAppStore from 'frontend/store/base/app/BaseAppStore';

class TradePortalAppStore extends BaseAppStore {
    @observable alertActiveTab: string;
    @observable alertInfoLoaded: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }

    @action setAlertActiveTab = (tab: string) => {
        this.alertActiveTab = tab;
    };

    @action setAlertInfoLoaded = (loaded: boolean) => {
        this.alertInfoLoaded = loaded;
    };
}

export default TradePortalAppStore;

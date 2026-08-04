import { action, computed, makeObservable, observable } from 'mobx';

import { BaseLayoutStore } from 'frontend/store/base/layout/BaseLayoutStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import SiteSettings from 'models/enum/SiteSettings';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export class TradePortalLayoutStore extends BaseLayoutStore {
    @observable isPricesHidden: boolean = false;
    @observable isPriceToggleCollapsed: boolean = false;
    @observable isPriceToggleHidden: boolean = false;

    constructor(public rootStore: TradePortalRootStore, public siteTemplatesIds = TradePortalSitecoreTemplateId) {
        super(rootStore, siteTemplatesIds);

        makeObservable(this);
    }

    @computed get isConfirmPage(): boolean {
        return this.templateId === this.siteTemplatesIds.Confirm;
    }

    @computed get isLoginPage(): boolean {
        return this.templateId === this.siteTemplatesIds.LoginPage;
    }

    @computed get isBundlesPage(): boolean {
        return this.templateId === this.siteTemplatesIds.BundlesPage;
    }

    @action updatePriceToggleStorageSettings = (newSetting: { [key: string]: boolean }): void => {
        const storedPriceToggleSettings = getWebStorageItem(WebStorageKeys.PriceToggleSettings, true) || {};

        setWebStorageItem(WebStorageKeys.PriceToggleSettings, {
            ...storedPriceToggleSettings,
            ...newSetting,
        });
    };

    @action setPriceToggleActive = (value: boolean): void => {
        this.isPricesHidden = value;
    };

    @action setIsPriceToggleHidden = (value: boolean): void => {
        this.isPriceToggleHidden = value;
    };

    @action onChangePriceToggle = (): void => {
        this.isPricesHidden = !this.isPricesHidden;
        this.updatePriceToggleStorageSettings({ isPricesHidden: this.isPricesHidden });

        if (this.rootStore.seatMapStore.isSeatMapOpened) {
            window.SeatsMapWidget?.setPricesHidden(this.isPricesHidden);
        }
    };

    @action setPriceToggleCollapsed = (value: boolean): void => {
        this.isPriceToggleCollapsed = value;
    };

    @action onChangePriceToggleCollapsed = (): void => {
        this.isPriceToggleCollapsed = !this.isPriceToggleCollapsed;
        this.updatePriceToggleStorageSettings({ isCollapsed: this.isPriceToggleCollapsed });
    };

    @computed get shouldRedirectToTradeLoginPage(): boolean {
        return this.isMaintenance && !this.isLoginPage;
    }

    @computed get shouldRedirectToHome(): boolean {
        return this.isGuestDetailsPage;
    }

    @computed get isCommitBookingPage(): boolean {
        return this.isConfirmPage;
    }

    /**
     * Get whether page requires price without rounding: payment and booking details pages
     */
    @computed get isNoRoundingPage(): boolean {
        return this.isCommitBookingPage || this.isViewBookingPage || this.isBookingsListPage || this.isConfirmationPage;
    }

    @computed get isSummaryBarEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsSummaryBarEnabled);
    }

    @computed get isBundlesPageEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsBundlesPageEnabled);
    }
}

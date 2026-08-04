import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import * as utils from 'frontend/utils/webStorage.utils';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import SiteSettings from 'models/enum/SiteSettings';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { TradePortalLayoutStore } from './TradePortalLayoutStore';

jest.mock('frontend/utils/webStorage.utils');
Object.defineProperty(window, 'SeatsMapWidget', {
    value: {
        setPricesHidden: jest.fn(),
    },
});

describe('TradePortalLayoutStore', () => {
    const createRootStore = () =>
        ({
            seatMapStore: {
                isSeatMapOpened: false,
            },
        } as TradePortalRootStore);

    let rootStore = createRootStore();
    const mockGetFromLocalStorage = jest.spyOn(utils, 'getWebStorageItem');
    const mockSetWebStorageItem = jest.spyOn(utils, 'setWebStorageItem').mockImplementation(jest.fn());
    let store;

    beforeEach(() => {
        jest.resetAllMocks();
        rootStore = createRootStore();
        mockGetFromLocalStorage.mockReturnValue({ isCollapsed: false, isPricesHidden: false });
        store = new TradePortalLayoutStore(rootStore);
    });

    describe('isCheapestMonthPriceEnabled', () => {
        it('should return false if getSettingAsBoolean return false', () => {
            store.getSettingAsBoolean = jest.fn().mockReturnValue(false);

            expect(store.isCheapestMonthPriceEnabled).toBe(false);
            expect(store.getSettingAsBoolean).toHaveBeenCalledWith('IsSearchCheapestMonthEnabled');
        });

        it('should return true if getSettingAsBoolean return true', () => {
            store.getSettingAsBoolean = jest.fn().mockReturnValue(true);

            expect(store.isCheapestMonthPriceEnabled).toBe(true);
        });
    });

    describe('isConfirmPage', () => {
        it('should return true when current template is Confirm page template', () => {
            store.layout = {
                sitecore: { route: { templateId: TradePortalSitecoreTemplateId.Confirm } },
            } as ISitecoreLayout;

            expect(store.isConfirmPage).toBe(true);
        });

        it('should return false when current template is NOT Confirm page template', () => {
            store.layout = {
                sitecore: { route: { templateId: TradePortalSitecoreTemplateId.GuestDetailsPage } },
            } as ISitecoreLayout;

            expect(store.isConfirmPage).toBe(false);
        });
    });

    describe('updatePriceToggleStorageSettings', () => {
        it('should change setting in local storage when storage is empty', () => {
            mockGetFromLocalStorage.mockReturnValue(undefined);

            store.updatePriceToggleStorageSettings({ isPricesHidden: true });

            expect(mockSetWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.PriceToggleSettings, {
                isPricesHidden: true,
            });
        });

        it('should change setting in local storage when there are items in storage', () => {
            store.updatePriceToggleStorageSettings({ isPricesHidden: true });

            expect(mockSetWebStorageItem).toBeCalledWith(WebStorageKeys.PriceToggleSettings, {
                isCollapsed: false,
                isPricesHidden: true,
            });
        });
    });

    describe('setPriceToggleActive', () => {
        it('should set isPricesHidden to true', () => {
            expect(store.isPricesHidden).toBe(false);

            store.setPriceToggleActive(true);

            expect(store.isPricesHidden).toBe(true);
        });
    });

    describe('onChangePriceToggle', () => {
        it('should update prices visibility settings to opposite', () => {
            store.updatePriceToggleStorageSettings = jest.fn();

            store.onChangePriceToggle();

            expect(store.isPricesHidden).toBe(true);
            expect(store.updatePriceToggleStorageSettings).toBeCalledWith({ isPricesHidden: true });
            expect(window.SeatsMapWidget.setPricesHidden).not.toBeCalled();
        });

        it('should call setPricesHidden when seat map widget is opened', () => {
            rootStore.seatMapStore.isSeatMapOpened = true;
            const store = new TradePortalLayoutStore(rootStore);
            store.updatePriceToggleStorageSettings = jest.fn();

            store.onChangePriceToggle();

            expect(store.isPricesHidden).toBe(true);
            expect(store.updatePriceToggleStorageSettings).toBeCalledWith({ isPricesHidden: true });
            expect(window.SeatsMapWidget.setPricesHidden).toBeCalledWith(true);
        });
    });

    describe('setPriceToggleCollapsed', () => {
        it('should set isPriceToggleCollapsed to true', () => {
            expect(store.isPriceToggleCollapsed).toBe(false);

            store.setPriceToggleCollapsed(true);

            expect(store.isPriceToggleCollapsed).toBe(true);
        });
    });

    describe('onChangePriceToggleCollapsed', () => {
        it('should update price toggle collapsed settings to opposite', () => {
            store.updatePriceToggleStorageSettings = jest.fn();

            store.onChangePriceToggleCollapsed();

            expect(store.isPriceToggleCollapsed).toBe(true);
            expect(store.updatePriceToggleStorageSettings).toBeCalledWith({ isCollapsed: true });
        });
    });

    describe('setIsPriceToggleHidden', () => {
        it('should update isPriceToggleHidden', () => {
            expect(store.isPriceToggleHidden).toBe(false);

            store.setIsPriceToggleHidden(true);

            expect(store.isPriceToggleHidden).toBe(true);
        });
    });

    describe('shouldRedirectToTradeLoginPage', () => {
        it('should return true when isMaintenance and is not LoginPage', () => {
            store.layout = {
                sitecore: {
                    context: { isFullMode: true },
                    route: { templateId: TradePortalSitecoreTemplateId.Confirm },
                },
            } as ISitecoreLayout;

            expect(store.shouldRedirectToTradeLoginPage).toBe(true);
        });

        it('should return false when is not Maintenance', () => {
            store.layout = {
                sitecore: {
                    context: { isFullMode: false },
                    route: { templateId: TradePortalSitecoreTemplateId.Confirm },
                },
            } as ISitecoreLayout;

            expect(store.shouldRedirectToTradeLoginPage).toBe(false);
        });

        it('should return false when is LoginPage', () => {
            store.layout = {
                sitecore: {
                    context: { isFullMode: false },
                    route: { templateId: TradePortalSitecoreTemplateId.LoginPage },
                },
            } as ISitecoreLayout;

            expect(store.shouldRedirectToTradeLoginPage).toBe(false);
        });
    });

    describe('shouldRedirectToHome', () => {
        it('should return false by default', () => {
            expect(store.shouldRedirectToHome).toBe(false);
        });

        it('should return true for guest details page', () => {
            jest.spyOn(store, 'isGuestDetailsPage', 'get').mockReturnValueOnce(true);

            expect(store.shouldRedirectToHome).toBe(true);
        });
    });

    it('isCommitBookingPage should return value of isConfirmPage', () => {
        jest.spyOn(store, 'isConfirmPage', 'get').mockReturnValueOnce(true);

        expect(store.isCommitBookingPage).toBe(true);
    });

    describe('isNoRoundingPage', () => {
        it('should return false by default', () => {
            expect(store.isNoRoundingPage).toBe(false);
        });

        ['isCommitBookingPage', 'isViewBookingPage', 'isBookingsListPage', 'isConfirmationPage'].forEach(flag => {
            it(`should return true when ${flag} is true`, () => {
                jest.spyOn(store, flag, 'get').mockReturnValueOnce(true);

                expect(store.isNoRoundingPage).toBe(true);
            });
        });
    });

    describe('isBundlesPage', () => {
        it('should return true when current template is bundles page template', () => {
            store.layout = {
                sitecore: { route: { templateId: TradePortalSitecoreTemplateId.BundlesPage } },
            } as ISitecoreLayout;

            expect(store.isBundlesPage).toBe(true);
        });

        it('should return false when current template is NOT bundles page template', () => {
            store.layout = {
                sitecore: { route: { templateId: TradePortalSitecoreTemplateId.GuestDetailsPage } },
            } as ISitecoreLayout;

            expect(store.isBundlesPage).toBe(false);
        });
    });

    describe('isBundlesPageEnabled', () => {
        it('should return false when setting is turned off', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(false);

            expect(store.isBundlesPageEnabled).toBe(false);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsBundlesPageEnabled);
        });

        it('should return true when setting is turned on', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(true);

            expect(store.isBundlesPageEnabled).toBe(true);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsBundlesPageEnabled);
        });
    });
});

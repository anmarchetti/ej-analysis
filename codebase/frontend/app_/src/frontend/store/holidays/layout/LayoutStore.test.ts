import { ILayoutInitialState } from 'frontend/store/base';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import SiteSettings from 'models/enum/SiteSettings';

import { LayoutStore } from './LayoutStore';

describe('LayoutStore', () => {
    let store;

    beforeEach(() => {
        jest.resetAllMocks();
        store = new LayoutStore({} as any);
    });

    describe('Password Prohibited Words', () => {
        it('should return empty list when setting value is NOT string type', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(1);

            expect(store.passwordProhibitedWords).toEqual([]);
        });

        it('should return empty list when setting value is empty string', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce('');

            expect(store.passwordProhibitedWords).toEqual([]);
        });

        it('should return list of words', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce('test,Test,1234');

            expect(store.passwordProhibitedWords).toEqual(['test', 'Test', '1234']);
        });
    });

    it('Should return true when template is room and board page', () => {
        expect(store.isAmendRoomAndBoardPage).toBe(false);

        store.deserialize({
            layout: { sitecore: { route: { templateId: SitecoreTemplateId.ChangeRoomAndBoardTemplate } } },
        } as ILayoutInitialState);

        expect(store.isAmendRoomAndBoardPage).toBe(true);
    });

    describe('isExternalExtrasEnabled', () => {
        it('should return false when setting is turned off', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(false);

            expect(store.isExternalExtrasEnabled).toBe(false);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsExternalExtrasEnabled);
        });

        it('should return true when setting is turned on', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(true);

            expect(store.isExternalExtrasEnabled).toBe(true);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsExternalExtrasEnabled);
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

    describe('isAirportParkingHidden', () => {
        it('should return false when setting is turned off', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(false);

            expect(store.isAirportParkingHidden).toBe(false);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsAirportParkingHidden);
        });

        it('should return true when setting is turned on', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(true);

            expect(store.isAirportParkingHidden).toBe(true);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsAirportParkingHidden);
        });
    });

    describe('isAirportParkingFreeCancellationPillEnabled', () => {
        it('should return false when setting is turned off', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(false);

            expect(store.isAirportParkingFreeCancellationPillEnabled).toBe(false);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsAirportParkingFreeCancellationPillEnabled);
        });

        it('should return true when setting is turned on', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(true);

            expect(store.isAirportParkingFreeCancellationPillEnabled).toBe(true);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsAirportParkingFreeCancellationPillEnabled);
        });
    });

    describe('isParkingDetailsViewPageEnabled', () => {
        it('should return false when setting is turned off', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(false);

            expect(store.isParkingDetailsViewPageEnabled).toBe(false);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsParkingDetailsViewPageEnabled);
        });

        it('should return true when setting is turned on', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(true);

            expect(store.isParkingDetailsViewPageEnabled).toBe(true);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsParkingDetailsViewPageEnabled);
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

        it('should return true for payment page', () => {
            jest.spyOn(store, 'isPaymentPage', 'get').mockReturnValueOnce(true);

            expect(store.shouldRedirectToHome).toBe(true);
        });
    });

    it('isCommitBookingPage should return value of isPaymentPage', () => {
        jest.spyOn(store, 'isPaymentPage', 'get').mockReturnValueOnce(true);

        expect(store.isCommitBookingPage).toBe(true);
    });

    describe('isNoRoundingPage', () => {
        it('should return false by default', () => {
            expect(store.isNoRoundingPage).toBe(false);
        });

        [
            'isCommitBookingPage',
            'isPayBalancePage',
            'isViewBookingPage',
            'isBookingsListPage',
            'isConfirmationPage',
        ].forEach(flag => {
            it(`should return true when ${flag} is true`, () => {
                jest.spyOn(store, flag, 'get').mockReturnValueOnce(true);

                expect(store.isNoRoundingPage).toBe(true);
            });
        });
    });

    describe('isCIAMFunctionalityEnabled', () => {
        it('returns true', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(1);

            expect(store.isCIAMFunctionalityEnabled).toEqual(true);
        });

        it('returns false', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(0);

            expect(store.isCIAMFunctionalityEnabled).toEqual(false);
        });

        it('returns false when setting is not provided', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce('');

            expect(store.isCIAMFunctionalityEnabled).toEqual(false);
        });
    });

    describe('isCIAMForgetPasswordFormEnabled', () => {
        it('returns true', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(1);

            expect(store.isCIAMForgetPasswordFormEnabled).toEqual(true);
        });

        it('returns false', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(0);

            expect(store.isCIAMForgetPasswordFormEnabled).toEqual(false);
        });

        it('returns false when setting is not provided', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce('');

            expect(store.isCIAMForgetPasswordFormEnabled).toEqual(false);
        });
    });

    describe('isCancelledBookingPage', () => {
        it('should return true when template id is cancelled booking page', () => {
            const store = new LayoutStore({} as any);

            expect(store.isCancelledBookingPage).toBe(false);

            store.deserialize({
                layout: { sitecore: { route: { templateId: SitecoreTemplateId.CancelledBookingPage } } },
            } as ILayoutInitialState);

            expect(store.isCancelledBookingPage).toBe(true);
        });

        it('should return false when template id is NOT cancelled booking page', () => {
            const store = new LayoutStore({} as any);

            expect(store.isCancelledBookingPage).toBe(false);

            store.deserialize({
                layout: { sitecore: { route: { templateId: SitecoreTemplateId.ChangeRoomAndBoardTemplate } } },
            } as ILayoutInitialState);

            expect(store.isCancelledBookingPage).toBe(false);
        });
    });

    describe('allowRefundsForXOrMoreDaysBeforeDeparture', () => {
        it('should return value of setting', () => {
            store.getSetting = jest.fn().mockReturnValueOnce(1);

            expect(store.allowRefundsForXOrMoreDaysBeforeDeparture).toEqual(1);
            expect(store.getSetting).toHaveBeenCalledWith(
                SiteSettings.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture,
            );
        });
    });

    describe('isCancelBookingPage', () => {
        it('should return true when template id is cancel booking page', () => {
            const store = new LayoutStore({} as any);

            expect(store.isCancelBookingPage).toBe(false);

            store.deserialize({
                layout: { sitecore: { route: { templateId: SitecoreTemplateId.CancelBookingPage } } },
            } as ILayoutInitialState);

            expect(store.isCancelBookingPage).toBe(true);
        });

        it('should return false when template id is NOT cancel booking page', () => {
            const store = new LayoutStore({} as any);

            expect(store.isCancelBookingPage).toBe(false);

            store.deserialize({
                layout: { sitecore: { route: { templateId: SitecoreTemplateId.ChangeRoomAndBoardTemplate } } },
            } as ILayoutInitialState);

            expect(store.isCancelBookingPage).toBe(false);
        });
    });

    describe('isBundlesPage', () => {
        it('should return true when template id is bundles page', () => {
            const store = new LayoutStore({} as any);

            expect(store.isBundlesPage).toBe(false);

            store.deserialize({
                layout: { sitecore: { route: { templateId: SitecoreTemplateId.BundlesPage } } },
            } as ILayoutInitialState);

            expect(store.isBundlesPage).toBe(true);
        });

        it('should return false when template id is NOT bundles page', () => {
            const store = new LayoutStore({} as any);

            expect(store.isBundlesPage).toBe(false);

            store.deserialize({
                layout: { sitecore: { route: { templateId: SitecoreTemplateId.ChangeRoomAndBoardTemplate } } },
            } as ILayoutInitialState);

            expect(store.isBundlesPage).toBe(false);
        });
    });

    describe('isHolidayCreditPage', () => {
        it('should return true when template id is holiday credit page', () => {
            const store = new LayoutStore({} as any);

            store.deserialize({
                layout: { sitecore: { route: { templateId: SitecoreTemplateId.HolidayCreditPage } } },
            } as ILayoutInitialState);

            expect(store.isHolidayCreditPage).toBe(true);
        });

        it('should return false when template id is NOT holiday credit page', () => {
            const store = new LayoutStore({} as any);

            store.deserialize({
                layout: { sitecore: { route: { templateId: SitecoreTemplateId.ChangeRoomAndBoardTemplate } } },
            } as ILayoutInitialState);

            expect(store.isHolidayCreditPage).toBe(false);
        });
    });

    describe('isGiftCardRedemptionEnabled', () => {
        it('should return false when setting is turned off', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValueOnce(false);

            expect(store.isGiftCardRedemptionEnabled).toBe(false);
        });

        it('should return true when setting is turned on', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValueOnce(true);

            expect(store.isGiftCardRedemptionEnabled).toBe(true);
        });
    });

    describe('isAddressLookupEnabled', () => {
        it('should return false when setting is turned off', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValueOnce(false);

            expect(store.isAddressLookupEnabled).toBe(false);
        });

        it('should return true when setting is turned on', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValueOnce(true);

            expect(store.isAddressLookupEnabled).toBe(true);
        });
    });
});

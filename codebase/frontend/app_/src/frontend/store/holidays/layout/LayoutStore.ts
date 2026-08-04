import { computed, makeObservable } from 'mobx';

import { BaseLayoutStore } from 'frontend/store/base/layout/BaseLayoutStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import SiteSettings from 'models/enum/SiteSettings';

export class LayoutStore extends BaseLayoutStore {
    constructor(public rootStore: HolidaysRootStore, public siteTemplatesIds = SitecoreTemplateId) {
        super(rootStore, siteTemplatesIds);
        makeObservable(this);
    }

    @computed get isCancelledBookingPage(): boolean {
        return this.templateId === this.siteTemplatesIds.CancelledBookingPage;
    }

    @computed get isBundlesPage(): boolean {
        return this.templateId === this.siteTemplatesIds.BundlesPage;
    }

    @computed get isCreateAccountPage(): boolean {
        return this.templateId === this.siteTemplatesIds.CreateAccountPage;
    }

    @computed get isPaymentPage(): boolean {
        return this.templateId === this.siteTemplatesIds.PaymentPage;
    }

    @computed get isPayBalancePage(): boolean {
        return this.templateId === this.siteTemplatesIds.PayBalancePage;
    }

    @computed get isRedeemVoucherPage(): boolean {
        return this.templateId === this.siteTemplatesIds.RedeemVoucher;
    }

    @computed get isGiftCardRedemptionEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.EnableGiftCardRedemption);
    }

    @computed get passwordProhibitedWords(): string[] {
        const setting = this.getSetting(SiteSettings.PasswordProhibitedWords);

        return setting && typeof setting === 'string' ? setting.split(',') : [];
    }

    @computed get isExternalExtrasEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsExternalExtrasEnabled);
    }

    @computed get isSummaryBarEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsSummaryBarEnabled);
    }

    @computed get isBundlesPageEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsBundlesPageEnabled);
    }

    //This is for A/B testing and should be removed after go live
    @computed get isAirportParkingHidden(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsAirportParkingHidden);
    }

    @computed get isAirportParkingFreeCancellationPillEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsAirportParkingFreeCancellationPillEnabled);
    }

    @computed get isParkingDetailsViewPageEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.IsParkingDetailsViewPageEnabled);
    }

    @computed get isCIAMFunctionalityEnabled(): boolean {
        return !!this.getSetting(SiteSettings.EnableCIAMFunctionality);
    }

    @computed get isCIAMForgetPasswordFormEnabled(): boolean {
        return !!this.getSetting(SiteSettings.EnableCIAMForgetPasswordForm);
    }

    @computed get allowRefundsForXOrMoreDaysBeforeDeparture(): number {
        return this.getSetting(SiteSettings.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture);
    }

    @computed get shouldRedirectToHome(): boolean {
        return this.isGuestDetailsPage || this.isPaymentPage;
    }

    @computed get daysBeforeDepartureToShowReminder(): number {
        return this.getSetting(SiteSettings.DaysBeforeDepartureToPay);
    }

    @computed get isCommitBookingPage(): boolean {
        return this.isPaymentPage;
    }

    @computed get isCancelBookingPage(): boolean {
        return this.templateId === this.siteTemplatesIds.CancelBookingPage;
    }

    /**
     * Get whether page requires price without rounding: payment and booking details pages
     */
    @computed get isNoRoundingPage(): boolean {
        return (
            this.isCommitBookingPage ||
            this.isPayBalancePage ||
            this.isViewBookingPage ||
            this.isBookingsListPage ||
            this.isConfirmationPage
        );
    }

    @computed get isHolidayCreditPage(): boolean {
        return this.templateId === this.siteTemplatesIds.HolidayCreditPage;
    }

    @computed get isAddressLookupEnabled(): boolean {
        return this.getSettingAsBoolean(SiteSettings.EnableAddressLookup);
    }
}

import { action, makeObservable, observable } from 'mobx';

import creditManagementService from 'frontend/services/creditManagement.service';
import { UserService } from 'frontend/services/user.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { ApiError } from 'models/data/ApiError';
import { IValidatedVoucher } from 'models/data/MyCreditInfo';
import HttpsStatusCodes from 'models/enum/HttpStatusCodes';
import { VoucherTypes } from 'models/enum/VoucherTypes';

export const OnlyVoucherIsApplicable = 'OnlyVoucherIsApplicable';

export class RedeemVoucherStore {
    @observable lastRedeemedVoucherCode: Nullable<string> = null;
    @observable isLoginToRedeemPopupVisible: boolean = false;
    @observable isValidatedVoucherPopupVisible: boolean = false;
    @observable isAppliedVoucherPopupVisible: boolean = false;
    @observable voucher: Nullable<IValidatedVoucher>;
    @observable error: Nullable<ApiError> = null;
    @observable isVoucherCodeProcessing: boolean = false;
    @observable isAccountCreatedForRedeemPopupVisible: boolean = false;
    @observable isCreditRedeemedOnExtrasPage: boolean = false;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @action initiateVoucherExtrasFlow = async (voucher: IValidatedVoucher): Promise<void> => {
        const { setUserDetails, setIsRedirectPreventedAfterLogin, onLogout } = this.rootStore.userStore;
        const isLoggedIn = await UserService.getStatus(false);

        this.setVoucher(voucher);

        if (isLoggedIn) {
            await setUserDetails();
            this.setValidatedVoucherPopupVisible(true);
        } else {
            await onLogout(true);
            setIsRedirectPreventedAfterLogin(true);
            this.setLoginToRedeemPopupVisible(true);
        }
    };

    @action validateVoucherAfterLogin = async (onSuccess?: () => void): Promise<void> => {
        try {
            await this.rootStore.userStore.setUserDetails();

            if (this.voucher && !this.voucher?.userCurrentBalance) {
                const res = await creditManagementService.validateVoucherCode(this.voucher?.voucherCode);
                this.setVoucher(res);
                onSuccess?.();
            }
        } catch (e) {
            this.closeAllPopups();
        }
    };

    @action validateVoucherCode = async (voucherCode: string, isOnlyVoucherApplicable?: boolean): Promise<void> => {
        if (!voucherCode) {
            return;
        }

        try {
            this.isVoucherCodeProcessing = true;
            const res = await creditManagementService.validateVoucherCode(voucherCode);

            if (
                isOnlyVoucherApplicable &&
                this.rootStore.layoutStore.isRedeemVoucherPage &&
                res.voucherType === VoucherTypes.PromoVoucher
            ) {
                throw new Error(OnlyVoucherIsApplicable);
            } else {
                const { setUserDetails, logoutIfNotSignedIn } = this.rootStore.userStore;
                await logoutIfNotSignedIn();
                await setUserDetails();
                this.setVoucher(res);
                this.setValidatedVoucherPopupVisible(true);
                this.isVoucherCodeProcessing = false;
            }
        } catch (e) {
            this.setError(e as ApiError);
            this.isVoucherCodeProcessing = false;
        }
    };

    @action redeemVoucher = async (voucherCode: string): Promise<void> => {
        try {
            this.isVoucherCodeProcessing = true;
            const res = await creditManagementService.redeemVoucher(voucherCode);
            this.setVoucher(res);
            this.setValidatedVoucherPopupVisible(false);
            this.setAppliedVoucherPopupVisible(true);
            this.setLatestRedeemedVoucherCode(voucherCode);
            this.isVoucherCodeProcessing = false;
        } catch (e) {
            if (e.response?.status === HttpsStatusCodes.Unauthorized) {
                await this.rootStore.userStore.onLogout(true);
                this.rootStore.layoutStore.isRedeemVoucherPage && this.rootStore.routerStore.redirectToLoginPage(true);
            }

            this.setValidatedVoucherPopupVisible(false);
            this.setVoucher(null);
            this.setError(e);
            this.isVoucherCodeProcessing = false;
        }
    };

    @action setLoginToRedeemPopupVisible = (state: boolean): void => {
        this.isLoginToRedeemPopupVisible = state;
    };

    @action setValidatedVoucherPopupVisible = (state: boolean): void => {
        this.isValidatedVoucherPopupVisible = state;
    };

    @action setAppliedVoucherPopupVisible = (state: boolean): void => {
        this.isAppliedVoucherPopupVisible = state;
    };

    @action setLatestRedeemedVoucherCode = (code: Nullable<string>): void => {
        this.lastRedeemedVoucherCode = code;
    };

    @action setVoucher = (voucher: Nullable<IValidatedVoucher>): void => {
        this.voucher = voucher;
    };

    @action setError = (e: Nullable<ApiError>): void => {
        this.error = e;
    };

    @action setAccountCreatedForRedeemPopupVisible = (state: boolean): void => {
        this.isAccountCreatedForRedeemPopupVisible = state;
    };

    @action setIsCreditRedeemedOnExtrasPage = (state: boolean): void => {
        this.isCreditRedeemedOnExtrasPage = state;
    };

    @action closeAllPopups = (): void => {
        this.isLoginToRedeemPopupVisible = false;
        this.isValidatedVoucherPopupVisible = false;
        this.isAppliedVoucherPopupVisible = false;
        this.isAccountCreatedForRedeemPopupVisible = false;
    };

    @action cleanupRedeemStore = (): void => {
        this.closeAllPopups();
        this.voucher = null;
        this.error = null;
        this.isVoucherCodeProcessing = false;
        this.isCreditRedeemedOnExtrasPage = false;
    };
}

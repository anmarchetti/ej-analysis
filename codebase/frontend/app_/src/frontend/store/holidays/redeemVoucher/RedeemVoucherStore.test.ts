import creditManagementService from 'frontend/services/creditManagement.service';
import { UserService } from 'frontend/services/user.service';
import { ApiError } from 'models/data/ApiError';
import { IValidatedVoucher } from 'models/data/MyCreditInfo';
import { VoucherTypes } from 'models/enum/VoucherTypes';

import { OnlyVoucherIsApplicable, RedeemVoucherStore } from './RedeemVoucherStore';

jest.mock('frontend/services/user.service');
jest.mock('frontend/services/creditManagement.service');

const voucher = {
    active: true,
    userCurrentBalance: 0,
    userNewBalance: 0,
    amount: 1,
    voucherCode: 'code',
    voucherType: VoucherTypes.GiftVoucher,
} as IValidatedVoucher;

describe('RedeemVoucherStore', () => {
    const createRoorStore = () =>
        ({
            userStore: {
                setIsRedirectPreventedAfterLogin: jest.fn(),
                onLogout: jest.fn(),
                setUserDetails: jest.fn(),
                logoutIfNotSignedIn: jest.fn(),
            },
            layoutStore: {
                isRedeemVoucherPage: true,
            },
            routerStore: {
                redirectToLoginPage: jest.fn(),
            },
        } as any);
    let rootStore = {} as any;

    beforeEach(() => {
        rootStore = createRoorStore();
    });

    describe('initiateVoucherExtrasFlow', () => {
        test('if user logged in set up user details and show validated popup', async () => {
            const store = new RedeemVoucherStore(rootStore);
            UserService.getStatus = jest.fn().mockReturnValue(Promise.resolve(true));
            store.setValidatedVoucherPopupVisible = jest.fn();

            await store.initiateVoucherExtrasFlow(voucher);

            expect(UserService.getStatus).toBeCalled();
            expect(store.voucher).toEqual(voucher);
            expect(store.rootStore.userStore.setUserDetails).toBeCalled();
            expect(store.setValidatedVoucherPopupVisible).toBeCalledWith(true);
        });

        test('if user not logged in show login popup', async () => {
            const store = new RedeemVoucherStore(rootStore);
            UserService.getStatus = jest.fn().mockReturnValue(Promise.resolve(false));
            store.setLoginToRedeemPopupVisible = jest.fn();

            await store.initiateVoucherExtrasFlow(voucher);

            expect(UserService.getStatus).toBeCalled();
            expect(store.voucher).toEqual(voucher);
            expect(store.rootStore.userStore.onLogout).toBeCalledWith(true);
            expect(store.rootStore.userStore.setIsRedirectPreventedAfterLogin).toBeCalledWith(true);
            expect(store.setLoginToRedeemPopupVisible).toBeCalledWith(true);
        });
    });

    describe('validateVoucherAfterLogin', () => {
        test('validate voucher if it exists and call onSuccess function', async () => {
            const store = new RedeemVoucherStore(rootStore);
            store.voucher = voucher;
            creditManagementService.validateVoucherCode = jest.fn().mockReturnValue(Promise.resolve(voucher));
            store.setVoucher = jest.fn();
            const onSucces = jest.fn();

            await store.validateVoucherAfterLogin(onSucces);

            expect(store.rootStore.userStore.setUserDetails).toBeCalled();
            expect(creditManagementService.validateVoucherCode).toBeCalledWith(store.voucher.voucherCode);
            expect(store.setVoucher).toBeCalledWith(voucher);
            expect(onSucces).toBeCalled();
        });

        test('validate voucher and if error then close popups', async () => {
            const store = new RedeemVoucherStore(rootStore);
            store.voucher = voucher;
            store.closeAllPopups = jest.fn();
            creditManagementService.validateVoucherCode = jest.fn().mockRejectedValueOnce(new Error());

            await store.validateVoucherAfterLogin();

            expect(store.rootStore.userStore.setUserDetails).toBeCalled();
            expect(store.closeAllPopups).toBeCalled();
        });

        test('do nothing if no there is no voucher', async () => {
            const store = new RedeemVoucherStore(rootStore);
            store.setVoucher = jest.fn();
            creditManagementService.validateVoucherCode = jest.fn();

            await store.validateVoucherAfterLogin();

            expect(store.rootStore.userStore.setUserDetails).toBeCalled();
            expect(creditManagementService.validateVoucherCode).not.toBeCalled();
            expect(store.setVoucher).not.toBeCalled();
        });
    });

    describe('validateVoucherCode', () => {
        test('if there is no voucher then do nothing', () => {
            const store = new RedeemVoucherStore(rootStore);
            store.setVoucher = jest.fn();
            store.setValidatedVoucherPopupVisible = jest.fn();
            creditManagementService.validateVoucherCode = jest.fn();

            store.validateVoucherCode('');
            expect(creditManagementService.validateVoucherCode).not.toBeCalled();
            expect(store.rootStore.userStore.logoutIfNotSignedIn).not.toBeCalled();
            expect(store.rootStore.userStore.setUserDetails).not.toBeCalled();
            expect(store.setVoucher).not.toBeCalled();
            expect(store.setValidatedVoucherPopupVisible).not.toBeCalled();
        });

        test('throw error if voucher is promo voucher', async () => {
            const store = new RedeemVoucherStore(rootStore);
            store.setVoucher = jest.fn();
            store.setValidatedVoucherPopupVisible = jest.fn();
            creditManagementService.validateVoucherCode = jest
                .fn()
                .mockReturnValue({ voucherType: VoucherTypes.PromoVoucher });
            const voucherCode = 'code';

            const promise = store.validateVoucherCode(voucherCode, true);

            expect(store.isVoucherCodeProcessing).toBeTruthy();

            await promise;

            expect(creditManagementService.validateVoucherCode).toBeCalledWith(voucherCode);
            expect(store.rootStore.userStore.logoutIfNotSignedIn).not.toBeCalled();
            expect(store.rootStore.userStore.setUserDetails).not.toBeCalled();
            expect(store.setVoucher).not.toBeCalled();
            expect(store.setValidatedVoucherPopupVisible).not.toBeCalled();
            expect(store.error?.message).toEqual(OnlyVoucherIsApplicable);
            expect(store.isVoucherCodeProcessing).toBeFalsy();
        });

        test('show validated popup if succeed', async () => {
            const store = new RedeemVoucherStore(rootStore);
            creditManagementService.validateVoucherCode = jest.fn().mockReturnValue(voucher);
            const voucherCode = 'code';

            const promise = store.validateVoucherCode(voucherCode, true);

            expect(store.isVoucherCodeProcessing).toBeTruthy();

            await promise;

            expect(creditManagementService.validateVoucherCode).toBeCalledWith(voucherCode);
            expect(store.rootStore.userStore.logoutIfNotSignedIn).toBeCalled();
            expect(store.rootStore.userStore.setUserDetails).toBeCalled();
            expect(store.voucher).toEqual(voucher);
            expect(store.isValidatedVoucherPopupVisible).toBeTruthy();
            expect(store.isVoucherCodeProcessing).toBeFalsy();
        });

        describe('redeemVoucher', () => {
            test('voucher redemption proceeded successfuly', async () => {
                const store = new RedeemVoucherStore(rootStore);
                creditManagementService.redeemVoucher = jest.fn().mockResolvedValue(voucher);
                const voucherCode = 'code';

                const promise = store.redeemVoucher(voucherCode);

                expect(store.isVoucherCodeProcessing).toBeTruthy();

                await promise;

                expect(creditManagementService.redeemVoucher).toBeCalledWith(voucherCode);
                expect(store.voucher).toEqual(voucher);
                expect(store.isValidatedVoucherPopupVisible).toBeFalsy();
                expect(store.isAppliedVoucherPopupVisible).toBeTruthy();
                expect(store.lastRedeemedVoucherCode).toEqual('code');
                expect(store.isVoucherCodeProcessing).toBeFalsy();
            });

            test('if authorization error then logout and redirect to login page', async () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setValidatedVoucherPopupVisible = jest.fn();
                store.setVoucher = jest.fn();
                const error = new ApiError({ response: { status: 401 } } as any);
                creditManagementService.redeemVoucher = jest.fn().mockRejectedValue(error);
                const voucherCode = 'code';

                const promise = store.redeemVoucher(voucherCode);

                expect(store.isVoucherCodeProcessing).toBeTruthy();

                await promise;

                expect(creditManagementService.redeemVoucher).toBeCalledWith(voucherCode);
                expect(store.rootStore.userStore.onLogout).toBeCalledWith(true);
                expect(store.rootStore.routerStore.redirectToLoginPage).toBeCalledWith(true);
                expect(store.setValidatedVoucherPopupVisible).toBeCalled();
                expect(store.setVoucher).toBeCalledWith(null);
                expect(store.error).toEqual(error);
                expect(store.isVoucherCodeProcessing).toBeFalsy();
            });

            test('if NOT authorization error then just set error', async () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setValidatedVoucherPopupVisible = jest.fn();
                store.setVoucher = jest.fn();
                const error = new ApiError({ message: 'error' } as any);
                creditManagementService.redeemVoucher = jest.fn().mockRejectedValue(error);
                const voucherCode = 'code';

                const promise = store.redeemVoucher(voucherCode);

                expect(store.isVoucherCodeProcessing).toBeTruthy();

                await promise;

                expect(creditManagementService.redeemVoucher).toBeCalledWith(voucherCode);
                expect(store.rootStore.userStore.onLogout).not.toBeCalledWith(true);
                expect(store.rootStore.routerStore.redirectToLoginPage).not.toBeCalledWith(true);
                expect(store.setValidatedVoucherPopupVisible).toBeCalled();
                expect(store.setVoucher).toBeCalledWith(null);
                expect(store.error).toEqual(error);
                expect(store.isVoucherCodeProcessing).toBeFalsy();
            });
        });

        describe('setLoginToRedeemPopupVisible', () => {
            test('set state from arguments', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setLoginToRedeemPopupVisible(true);

                expect(store.isLoginToRedeemPopupVisible).toBeTruthy();
            });
        });

        describe('setValidatedVoucherPopupVisible', () => {
            test('set state from arguments', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setValidatedVoucherPopupVisible(true);

                expect(store.isValidatedVoucherPopupVisible).toBeTruthy();
            });
        });

        describe('setAppliedVoucherPopupVisible', () => {
            test('set state from arguments', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setAppliedVoucherPopupVisible(true);

                expect(store.isAppliedVoucherPopupVisible).toBeTruthy();
            });
        });

        describe('setLatestRedeemedVoucherCode', () => {
            test('set state from arguments', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setLatestRedeemedVoucherCode('code');

                expect(store.lastRedeemedVoucherCode).toEqual('code');
            });
        });

        describe('setVoucher', () => {
            test('set state from arguments', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setVoucher(voucher);

                expect(store.voucher).toEqual(voucher);
            });
        });

        describe('setError', () => {
            test('set state from arguments', () => {
                const store = new RedeemVoucherStore(rootStore);
                const error = new ApiError({ message: 'my error' } as any);
                store.setError(error);

                expect(store.error).toEqual(error);
            });
        });

        describe('setAccountCreatedForRedeemPopupVisible', () => {
            test('set state from arguments', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setAccountCreatedForRedeemPopupVisible(true);

                expect(store.isAccountCreatedForRedeemPopupVisible).toBeTruthy();
            });
        });

        describe('setIsCreditRedeemedOnExtrasPage', () => {
            test('set state from arguments', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.setIsCreditRedeemedOnExtrasPage(true);

                expect(store.isCreditRedeemedOnExtrasPage).toBeTruthy();
            });
        });

        describe('closeAllPopups', () => {
            test('close all popups', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.isLoginToRedeemPopupVisible = true;
                store.isValidatedVoucherPopupVisible = true;
                store.isAppliedVoucherPopupVisible = true;
                store.isAccountCreatedForRedeemPopupVisible = true;

                store.closeAllPopups();

                expect(store.isLoginToRedeemPopupVisible).toBeFalsy();
                expect(store.isValidatedVoucherPopupVisible).toBeFalsy();
                expect(store.isAppliedVoucherPopupVisible).toBeFalsy();
                expect(store.isAccountCreatedForRedeemPopupVisible).toBeFalsy();
            });
        });

        describe('cleanupRedeemStore', () => {
            test('clean store', () => {
                const store = new RedeemVoucherStore(rootStore);
                store.voucher = voucher;
                store.error = new ApiError({ message: 'my error' } as any);
                store.isVoucherCodeProcessing = true;
                store.isCreditRedeemedOnExtrasPage = true;
                store.closeAllPopups = jest.fn();

                store.cleanupRedeemStore();

                expect(store.closeAllPopups).toBeCalled();
                expect(store.voucher).toBeNull();
                expect(store.error).toBeNull();
                expect(store.isVoucherCodeProcessing).toBeFalsy();
                expect(store.isCreditRedeemedOnExtrasPage).toBeFalsy();
            });
        });
    });
});

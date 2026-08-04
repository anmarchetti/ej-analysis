import BaseGuestDetailsStore from 'frontend/store/base/guestDetails/BaseGuestDetailsStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { createAdultDetails } from 'frontend/utils/guestsValidation';
import { submitForm } from 'frontend/utils/submitForm';
import { ApiError } from 'models/data/ApiError';
import { ILoginInfo } from 'models/data/ILoginInfo';
import { LoginCustomer } from 'models/data/LoginCustomer';
import { IValidationError } from 'models/data/validation/IValidationError';
import { GuestDetailsPhase } from 'models/enum/GuestDetailsPhase';
import { GuestType } from 'models/enum/GuestType';
import { GuestInfo } from 'models/GuestInfo';

import { GuestDetailsStore, OfferSectionTypes } from './GuestDetailsStore';

jest.mock('frontend/utils/submitForm', () => ({
    submitForm: jest.fn(),
}));
const mockSubmitForm = submitForm as jest.MockedFn<typeof submitForm>;

const createRootStore = () =>
    ({
        bookingStore: {},
        layoutStore: { isTradePortal: false },
        userStore: { isLoggedIn: false },
    } as any);

describe('GuestDetails', () => {
    let mockRootStore;

    beforeEach(() => {
        mockRootStore = createRootStore();
    });

    describe('changeOffersAndUpdates', () => {
        test('Should set isOffersOptedIn to true', () => {
            const store = new GuestDetailsStore(mockRootStore);
            expect(store.isOffersOptedIn).toBeUndefined();
            store.changeOffersAndUpdates(OfferSectionTypes.IsOffersOptedIn, true);
            expect(store.isOffersOptedIn).toBeTruthy();
        });

        test('Should NOT set isPartnerOffersOptedIn to false', () => {
            const store = new GuestDetailsStore(mockRootStore);
            store.isPartnerOffersOptedIn = true;
            expect(store.isOffersOptedIn).toBeUndefined();
            store.changeOffersAndUpdates(OfferSectionTypes.IsOffersOptedIn, false);
            expect(store.isOffersOptedIn).toBeFalsy();
            expect(store.isPartnerOffersOptedIn).toBeTruthy();
        });

        test('Should set isPartnerOffersOptedIn and isOffersOptedIn to false', () => {
            const store = new GuestDetailsStore(mockRootStore);
            store.isOffersOptedIn = true;
            expect(store.isPartnerOffersOptedIn).toBeUndefined();
            store.changeOffersAndUpdates(OfferSectionTypes.IsOffersOptedIn, false);
            expect(store.isPartnerOffersOptedIn).toBeFalsy();
            expect(store.isOffersOptedIn).toBeFalsy();
        });
    });

    describe('isSpecialOffersSectionValid', () => {
        test('Should return true if user logged in', () => {
            mockRootStore.userStore.isLoggedIn = true;
            const store = new GuestDetailsStore(mockRootStore);
            store.customerLogin.isEmailValidated = true;
            expect(store.isSpecialOffersSectionValid).toBeTruthy();
        });

        test('Should return true if user not logged in and user select "No" for receive offers', () => {
            const store = new GuestDetailsStore(mockRootStore);
            store.isOffersOptedIn = false;
            store.customerLogin.isEmailValidated = true;
            expect(store.isSpecialOffersSectionValid).toBeTruthy();
        });

        test('Should return true if user not logged in and user select "Yes" for receive offers and and "Yes or No" for receive partners offers', () => {
            const store = new GuestDetailsStore(mockRootStore);
            store.isOffersOptedIn = true;
            store.isPartnerOffersOptedIn = false;
            store.customerLogin.isEmailValidated = true;
            expect(store.isSpecialOffersSectionValid).toBeTruthy();
        });

        test('Should return false if user not logged in and user not select any button for receive offers', () => {
            const store = new GuestDetailsStore(mockRootStore);
            store.isOffersOptedIn = undefined;
            store.customerLogin.isEmailValidated = true;
            expect(store.isSpecialOffersSectionValid).toBeFalsy();
        });

        test('Should return true if user not logged in and user select "Yes" for receive offers and not select any button for receive partners offers', () => {
            const store = new GuestDetailsStore(mockRootStore);
            store.isOffersOptedIn = true;
            store.isPartnerOffersOptedIn = undefined;
            store.customerLogin.isEmailValidated = true;
            expect(store.isSpecialOffersSectionValid).toBeFalsy();
        });
    });

    describe('changePartnerOffersAndUpdates', () => {
        test('Should set isOffersOptedIn to true', () => {
            const store = new GuestDetailsStore(mockRootStore);
            expect(store.isPartnerOffersOptedIn).toBeUndefined();
            store.changeOffersAndUpdates(OfferSectionTypes.IsPartnerOffersOptedIn, true);
            expect(store.isPartnerOffersOptedIn).toBeTruthy();
        });
    });

    describe('isFormValid', () => {
        beforeEach(() => {
            jest.spyOn(BaseGuestDetailsStore.prototype, 'guestDetailsErrors', 'get').mockImplementation(() => []);
            jest.spyOn(LoginCustomer.prototype, 'passwordErrors', 'get').mockImplementation(() => []);
        });

        test('should return true if no form errors and policy confirmed', () => {
            const store = new GuestDetailsStore(mockRootStore);
            store.confirmPolicy = true;
            jest.spyOn(store, 'isSpecialOffersSectionValid', 'get').mockReturnValue(true);

            expect(store.isFormValid).toBeTruthy();
        });

        test('should return false if there are guest details errors', () => {
            jest.spyOn(BaseGuestDetailsStore.prototype, 'guestDetailsErrors', 'get').mockImplementation(
                () => [{ errorMessage: 'error' }] as IValidationError[],
            );
            const store = new GuestDetailsStore(mockRootStore);
            store.confirmPolicy = true;
            jest.spyOn(store, 'isSpecialOffersSectionValid', 'get').mockReturnValue(true);

            expect(store.isFormValid).toBeFalsy();
        });

        test('should return false if there are customer login errors', () => {
            jest.spyOn(LoginCustomer.prototype, 'passwordErrors', 'get').mockImplementation(
                () => [{ errorMessage: 'password error' }] as IValidationError[],
            );
            const store = new GuestDetailsStore(mockRootStore);
            store.confirmPolicy = true;
            store.customerLogin.isEmailValidated = true;
            jest.spyOn(store, 'isSpecialOffersSectionValid', 'get').mockReturnValue(true);

            expect(store.isFormValid).toBeFalsy();
        });

        test('should return false if policy not confirmed', () => {
            const store = new GuestDetailsStore(mockRootStore);
            jest.spyOn(store, 'isSpecialOffersSectionValid', 'get').mockReturnValue(true);
            store.confirmPolicy = false;

            expect(store.isFormValid).toBeFalsy();
        });
    });

    describe('initialize ', () => {
        test('should call setUserDetails and set GuestsInfo phase for logged in user', async () => {
            const userStore = { setUserDetails: jest.fn(), isLoggedIn: true };
            const store = new GuestDetailsStore({ userStore, layoutStore: {} } as any);

            store.createGuestsDetails = jest.fn();

            await store.initialize();

            expect(userStore.setUserDetails).toBeCalled();
            expect(store.guestDetailsPhase).toBe(GuestDetailsPhase.GuestsInfo);
        });

        test('should call setUserDetails and set VerifyEmail for NOT logged in user', async () => {
            const userStore = { setUserDetails: jest.fn(), isLoggedIn: false };
            const store = new GuestDetailsStore({ userStore, layoutStore: {} } as any);
            store.createGuestsDetails = jest.fn();

            await store.initialize();

            expect(userStore.setUserDetails).toBeCalled();
            expect(store.guestDetailsPhase).toBe(GuestDetailsPhase.VerifyEmail);
        });
    });

    describe('initializeEmailVerificationPage ', () => {
        test('should return true if all guest info valid', () => {
            const userStore = { onLogout: jest.fn(), isLoggedIn: true };
            const store = new GuestDetailsStore({ userStore } as any);
            store.guestsDetails = [createAdultDetails(20, true)];
            store.createGuestsDetails = jest.fn();

            store.initializeEmailVerificationPage();

            expect(userStore.onLogout).toBeCalledWith(true);
            expect(store.createGuestsDetails).toBeCalled();
        });
    });

    describe('onSelectContinue ', () => {
        let rootStore: HolidaysRootStore;
        const leadPassenger = { type: GuestType.Adult, isLead: true } as GuestInfo;

        beforeEach(() => {
            rootStore = {
                layoutStore: {
                    basePath: '/en/holidays',
                },
                userStore: {
                    register: jest.fn(),
                    customerErrorHandler: jest.fn().mockReturnValue([{}]),
                },
                bookingStore: {
                    commitBookingGuestsInfo: {
                        guests: [leadPassenger],
                        leadPassenger: leadPassenger,
                    },
                },
                trackingStore: {
                    continueToPaymentTrigger: jest.fn(),
                    setPreviousPage: jest.fn(),
                },
                queryParamsStore: {
                    buildHotelDetailsQuery: jest.fn(() => '?hotel-query'),
                },
            } as any;
        });

        it('should go to payment, register a new user and call saveGuestDetailsToSessionStorage', async () => {
            const store = new GuestDetailsStore(rootStore);
            store.guestsDetails = [leadPassenger];
            store.customerLogin.isEmailExists = false;
            store.customerLogin.isEmailValidated = true;
            store.saveGuestDetailsToSessionStorage = jest.fn();

            await store.onSelectContinue();

            expect(rootStore.userStore.register).toBeCalled();
            expect(mockSubmitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/payment?hotel-query',
                'guests-info-payload',
                {
                    guests: [leadPassenger],
                    leadPassenger: leadPassenger,
                    deviceId: '',
                },
            );
            expect(rootStore.trackingStore.setPreviousPage).toHaveBeenCalled();
            expect(rootStore.trackingStore.continueToPaymentTrigger).toHaveBeenCalled();
            expect(store.saveGuestDetailsToSessionStorage).toHaveBeenCalled();
        });

        it('should go to payment without register a new user if account exists', async () => {
            const store = new GuestDetailsStore(rootStore);
            store.guestsDetails = [leadPassenger];
            store.customerLogin.isEmailExists = true;
            store.customerLogin.isEmailValidated = true;

            await store.onSelectContinue();

            expect(rootStore.userStore.register).not.toBeCalled();
            expect(mockSubmitForm).toBeCalled();
            expect(rootStore.trackingStore.continueToPaymentTrigger).toBeCalled();
        });

        it('should go to payment without register a new user if passenger is not lead', async () => {
            const store = new GuestDetailsStore(rootStore);
            store.guestsDetails = [{ isLead: false } as GuestInfo];
            store.customerLogin.isEmailExists = true;
            store.customerLogin.isEmailValidated = true;

            await store.onSelectContinue();

            expect(rootStore.userStore.register).not.toBeCalled();
            expect(mockSubmitForm).toHaveBeenCalled();
            expect(rootStore.trackingStore.continueToPaymentTrigger).toBeCalled();
        });

        it('should NOT go to payment if register was failed', async () => {
            (rootStore.userStore.register as jest.Mock).mockRejectedValueOnce(new ApiError({ message: 'test' } as any));

            const store = new GuestDetailsStore(rootStore);
            store.guestsDetails = [leadPassenger];
            store.customerLogin.isEmailExists = false;
            store.customerLogin.isEmailValidated = true;

            await expect(store.onSelectContinue()).rejects.toThrow();

            expect(rootStore.userStore.register).toBeCalled();
            expect(store.customerLogin.errors.length).toBe(1);
            expect(mockSubmitForm).not.toHaveBeenCalled();
        });
    });

    describe('initializeGuestsInfoPage ', () => {
        test('should set VerifyEmail Phase if email not validated', () => {
            const userStore = { onLogout: jest.fn(), isLoggedIn: true };
            const store = new GuestDetailsStore({ userStore } as any);
            store.guestsDetails = [createAdultDetails(20, true)];
            store.createGuestsDetails = jest.fn();

            store.initializeGuestsInfoPage();

            expect(store.guestDetailsPhase).toBe(GuestDetailsPhase.VerifyEmail);
        });

        test('should update user info', () => {
            const userStore = {
                isLoggedIn: true,
                userData: {
                    email: 'email',
                    firstName: 'firstName',
                    lastName: 'lastName',
                    title: 'title',
                    mobilePhone: 'mobilePhone',
                    birthDate: '2000-10-10',
                    address1: 'address1',
                    address2: 'address2',
                    city: 'city',
                    postalCode: 'postalCode',
                    mailingsFlag: false,
                    easyJetMailingsFlag: false,
                } as ILoginInfo,
            };
            const routerStore = {
                updateValidateEmailPage: jest.fn(),
            };
            const layoutStore = {
                getSetting: jest.fn(),
                getPhrase: jest.fn(),
            };
            const store = new GuestDetailsStore({ userStore, routerStore, layoutStore } as any);
            store.customerLogin.isEmailExists = true;
            store.customerLogin.isEmailValidated = true;
            store.getGuestDetailsFromSessionStorage = jest.fn().mockReturnValue([]);
            store.loadReferenceData = jest.fn();
            store.guestsDetails = [createAdultDetails(20, true)];

            store.initializeGuestsInfoPage();

            expect(store.leadPassenger?.email).toBe('email');
        });
    });

    describe('validateEmail ', () => {
        let rootStore: any;

        beforeEach(() => {
            rootStore = {
                userStore: {
                    verifyEmail: jest.fn(),
                    isVerifyingEmail: false,
                    customerErrorHandler: jest.fn(),
                },
                trackingStore: {
                    trackAccountIdentifiedEvent: jest.fn(),
                },
            };
        });

        test("shouldn't call any functions if email is verifying", async () => {
            rootStore.userStore.isVerifyingEmail = true;
            const store = new GuestDetailsStore(rootStore);

            await store.validateEmail();
            expect(rootStore.userStore.verifyEmail).not.toBeCalled();
        });

        test("shouldn't validate email", async () => {
            rootStore.userStore.verifyEmail.mockRejectedValueOnce(new ApiError({ message: 'test' } as any));
            const store = new GuestDetailsStore(rootStore);

            await store.validateEmail();
            expect(rootStore.userStore.verifyEmail).toBeCalled();
            expect(store.customerLogin.isEmailExists).toBeFalsy();
            expect(store.customerLogin.isEmailValidated).toBeFalsy();
            expect(rootStore.trackingStore.trackAccountIdentifiedEvent).not.toBeCalled();
        });

        test("should validate email and set Guests Info Phase if email doesn't exist", async () => {
            rootStore.userStore.verifyEmail.mockResolvedValue(false);
            const store = new GuestDetailsStore(rootStore);

            await store.validateEmail();
            expect(rootStore.userStore.verifyEmail).toBeCalled();
            expect(store.customerLogin.isEmailExists).toBeFalsy();
            expect(store.customerLogin.isEmailValidated).toBeTruthy();
            expect(rootStore.trackingStore.trackAccountIdentifiedEvent).toBeCalled();
            expect(store.guestDetailsPhase).toBe(GuestDetailsPhase.GuestsInfo);
        });

        test("should validate email and set Guests Info Phase if email exist and it's NOT signIn flow", async () => {
            rootStore.userStore.verifyEmail.mockResolvedValue(true);
            const store = new GuestDetailsStore(rootStore);

            store.hasSignInPrompt = false;

            await store.validateEmail();
            expect(rootStore.userStore.verifyEmail).toBeCalled();
            expect(store.customerLogin.isEmailExists).toBeTruthy();
            expect(store.customerLogin.isEmailValidated).toBeTruthy();
            expect(rootStore.trackingStore.trackAccountIdentifiedEvent).toBeCalled();
            expect(store.guestDetailsPhase).toBe(GuestDetailsPhase.GuestsInfo);
        });

        test("should validate email and NOT set Guests Info Phase if email exist and it's signIn flow ", async () => {
            rootStore.userStore.verifyEmail.mockResolvedValue(true);
            const store = new GuestDetailsStore(rootStore);
            store.hasSignInPrompt = true;

            await store.validateEmail();
            expect(rootStore.userStore.verifyEmail).toBeCalled();
            expect(store.customerLogin.isEmailExists).toBeTruthy();
            expect(store.customerLogin.isEmailValidated).toBeTruthy();
            expect(store.guestDetailsPhase).not.toBe(GuestDetailsPhase.GuestsInfo);
        });
    });

    describe('signIn ', () => {
        test('should call signIn function and set Guests Info Phase', async () => {
            const userStore = {
                signIn: jest.fn(),
            };
            const store = new GuestDetailsStore({ userStore } as any);

            await store.signIn(jest.fn());

            expect(userStore.signIn).toHaveBeenCalled();
            expect(store.guestDetailsPhase).toBe(GuestDetailsPhase.GuestsInfo);
        });

        test('should call signIn and set error', async () => {
            const userStore = {
                signIn: jest.fn().mockRejectedValue(new ApiError({ message: 'test' } as any)),
                customerErrorHandler: jest.fn().mockReturnValue([{}]),
            };
            const store = new GuestDetailsStore({ userStore } as any);

            await store.signIn(jest.fn());

            expect(userStore.signIn).toBeCalled();
            expect(store.customerLogin.errors.length).toBe(1);
        });

        it('should call GA callback function after successful login', async () => {
            const userStore = {
                signIn: jest.fn(),
            };
            const store = new GuestDetailsStore({ userStore } as any);
            const mockCallback = jest.fn();

            await store.signIn(mockCallback);

            expect(userStore.signIn).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalled();
        });

        it('should NOT call GA callback function after failed login', async () => {
            const userStore = {
                signIn: jest.fn().mockRejectedValue(new ApiError({ message: 'test' } as any)),
                customerErrorHandler: jest.fn().mockReturnValue([{}]),
            };
            const store = new GuestDetailsStore({ userStore } as any);
            const mockCallback = jest.fn();

            await store.signIn(mockCallback);

            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('cleanUpGuestDetails  ', () => {
        test('should clear store info', () => {
            const store = new GuestDetailsStore({} as any);

            store.cleanUpGuestDetails();

            expect(store.isOffersOptedIn).toBeUndefined();
            expect(store.isPartnerOffersOptedIn).toBeUndefined();
            expect(store.guestDetailsPhase).toBeNull();
            expect(store.confirmPolicy).toBeFalsy();
            expect(store.forceErrors).toBeFalsy();
        });
    });

    describe('setIsAddressLookup', () => {
        it('should set isAddressLookup', () => {
            const store = new GuestDetailsStore({} as any);

            expect(store.isAddressLookup).toBe(true);

            store.setIsAddressLookup(false);

            expect(store.isAddressLookup).toBe(false);
        });
    });
});

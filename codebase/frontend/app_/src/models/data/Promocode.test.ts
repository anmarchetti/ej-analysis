import { createMockStores, paymentInfoMock } from 'frontend/__mocks__';
import { getWebStorageItem, removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ApiErrors } from 'models/enum/ApiErrors';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { validationErrorOnBlurMock } from 'frontend/components/renderings/PromocodeInput/__mocks__/promocodeInput.mocks';

import { ApiError } from './ApiError';
import { IUnit } from './IOffer';
import { Promocode } from './Promocode';

jest.mock('frontend/utils/webStorage.utils');

const mockedGetPromocodeErrors = jest.fn().mockImplementation(() => [validationErrorOnBlurMock]);
jest.mock('frontend/components/renderings/PromocodeInput/promocodeInput.utils', () => ({
    getPromocodeErrors: (...params) => mockedGetPromocodeErrors(...params),
}));

const createRootStore = () =>
    createMockStores({
        bookingStore: {
            packageInfo: paymentInfoMock,
            isFlightExternal: true,
            togglePriceManipulating: jest.fn(),
            validatePackage: jest.fn(),
            clearPromoCode: jest.fn(),
        },
        trackingStore: { trackPromocodeError: jest.fn() },
    });

describe('Promocode', () => {
    let rootStore: any = createRootStore();
    let store: Promocode;

    beforeEach(() => {
        jest.restoreAllMocks();
        rootStore = createRootStore();
        store = new Promocode(rootStore);
    });

    const code = 'testcode';
    const packageId = 'packageId';
    const units = [
        { occupation: { adults: 1, children: 1, infants: 1, childAges: [3] } },
        { occupation: { adults: 2, children: 2, infants: 2, childAges: [3, 3] } },
    ] as IUnit[];

    const mockGetFromLocalStorage = (storage = { 'packageId-1.1.1-2.2.2': code, otherCode: 'otherCode' }) => {
        (getWebStorageItem as any).mockImplementation(() => storage);
    };

    describe('setters', () => {
        [
            { property: 'isPromocodeApplying', setter: 'setIsPromocodeApplying' },
            { property: 'promocodeErrorCode', setter: 'setPromocodeErrorCode' },
            { property: 'promocodeForceError', setter: 'setPromocodeForceError' },
            { property: 'promocodeValidationErrors', setter: 'setPromocodeValidationErrors' },
        ].forEach(({ property, setter }) => {
            it(`${setter} should set ${property}`, () => {
                store[property] = false;

                store[setter](true);

                expect(store[property]).toBe(true);
            });
        });
    });

    it('should set code in LocalStorage', () => {
        store.value = code;

        store.setInLocalStorage(packageId, units);

        expect(setWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.Promocode, { 'packageId-1.1.1-2.2.2': code });
    });

    it('should NOT set code in LocalStorage when NO value', () => {
        store.setInLocalStorage(packageId, units);

        expect(setWebStorageItem).not.toHaveBeenCalled();
    });

    it('should parse promocode from LocalStorage', () => {
        mockGetFromLocalStorage();
        expect(store.value).toEqual(undefined);
        expect(store.isPromocode(packageId, units)).toBeTruthy();

        store.parseFromLocalStorage(packageId, units);

        expect(store.value).toEqual(code);
    });

    it('should clear promocode and set LocalStorage value without this code', () => {
        mockGetFromLocalStorage();
        store.value = code;

        store.clear(packageId, units);

        expect(store.value).toEqual(undefined);
        expect(getWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.Promocode, true);
        expect(setWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.Promocode, { otherCode: 'otherCode' });
    });

    it('should NOT update LocalStorage on clear when code is NOT stored in LocalStorage', () => {
        mockGetFromLocalStorage(null as any);
        store.value = code;

        store.clear(packageId, units);

        expect(store.value).toEqual(undefined);
        expect(getWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.Promocode, true);
        expect(setWebStorageItem).not.toHaveBeenCalled();
    });

    it('should NOT clear when NO value', () => {
        store.clear(packageId, units);

        expect(getWebStorageItem).not.toHaveBeenCalled();
        expect(setWebStorageItem).not.toHaveBeenCalled();
    });

    it('should clear all promocodes stored in LocalStorage', () => {
        store.value = code;

        store.clearAll();

        expect(store.value).toEqual(undefined);
        expect(removeWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.Promocode);
    });

    it('should clearPromocodeError', () => {
        store.setPromocodeErrorCode = jest.fn();
        store.setPromocodeValidationErrors = jest.fn();
        store.setPromocodeForceError = jest.fn();

        store.clearPromocodeError();

        expect(store.setPromocodeErrorCode).toHaveBeenCalledWith('');
        expect(store.setPromocodeValidationErrors).toHaveBeenCalledWith([]);
        expect(store.setPromocodeForceError).toHaveBeenCalledWith(false);
    });

    describe('setPromocodeError', () => {
        it('should set promocode error', () => {
            store.setPromocodeErrorCode = jest.fn();
            store.setPromocodeValidationErrors = jest.fn();
            store.setPromocodeForceError = jest.fn();

            store.setPromocodeError({ errorCode: ApiErrors.DenyPayment } as ApiError);

            expect(store.setPromocodeErrorCode).not.toHaveBeenCalled();
            expect(store.setPromocodeValidationErrors).toHaveBeenCalledWith([validationErrorOnBlurMock]);
            expect(store.setPromocodeForceError).toHaveBeenCalledWith(true);
        });

        it('should set promocode validation error', () => {
            store.setPromocodeErrorCode = jest.fn();
            store.setPromocodeValidationErrors = jest.fn();
            store.setPromocodeForceError = jest.fn();

            store.setPromocodeError({ errorCode: ApiErrors.PromocodeValidation } as ApiError);

            expect(store.setPromocodeErrorCode).toHaveBeenCalledWith(ApiErrors.PromocodeValidation);
        });
    });

    describe('onPromocodeErrorCallback', () => {
        it('should react on promocode errors for common error', () => {
            store.setPromocodeError = jest.fn();
            store.clearPromocodeError = jest.fn();
            store.setIsPromocodeApplying = jest.fn();

            store.onPromocodeErrorCallback({ errorCode: ApiErrors.DenyPayment } as ApiError);

            expect(store.setIsPromocodeApplying).toHaveBeenCalledWith(false);
            expect(store.clearPromocodeError).toHaveBeenCalled();
            expect(store.setPromocodeError).toHaveBeenCalledWith({ errorCode: ApiErrors.DenyPayment });
            expect(rootStore.trackingStore.trackPromocodeError).toHaveBeenCalled();
            expect(rootStore.bookingStore.clearPromoCode).toHaveBeenCalled();
        });

        it('should react on promocode errors when discount is wrong', () => {
            store.setPromocodeError = jest.fn();
            store.clearPromocodeError = jest.fn();
            store.setIsPromocodeApplying = jest.fn();

            store.onPromocodeErrorCallback({
                errorCode: ApiErrors.PromocodeValidation,
                innerErrors: [{ code: ApiErrors.WrongSystemDiscount }],
            } as ApiError);

            expect(store.setPromocodeError).toHaveBeenCalledWith({
                errorCode: ApiErrors.PromocodeValidation,
                innerErrors: [{ code: ApiErrors.WrongSystemDiscount }],
            });
            expect(store.clearPromocodeError).not.toHaveBeenCalled();
        });
    });
});

import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import useGuestDetailsFull, { IUseGuestDetailsFullProps, scrollIntoErrors } from './GuestDetailsFull.utils';

const createStores = () =>
    createMockStores({
        guestDetailsStore: {
            adults: [{ name: 'Adult 1' }],
            children: [{ name: 'Child 1' }],
            infants: [{ name: 'Infant 1' }],
            confirmPolicy: true,
            toggleForceErrors: jest.fn(),
            forceErrors: false,
            isFormValid: true,
            formErrors: [],
            onSelectContinue: jest.fn(),
            setIsAddressLookup: jest.fn(),
            isAddressLookup: false,
        },
        userStore: { isLoggedIn: false },
        trackingStore: { trackValidation: jest.fn() },
    });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('GuestDetailsFull.utils', () => {
    describe('useGuestDetailsFull', () => {
        beforeEach(() => {
            mockStores = createStores();
        });

        it('should return correct data when all fields are provided', () => {
            const {
                result: { current },
            } = renderHook(() => useGuestDetailsFull({ fields: {} } as IUseGuestDetailsFullProps));

            expect(current).toStrictEqual({
                adults: [
                    {
                        name: 'Adult 1',
                    },
                ],
                changeOffersAndUpdates: undefined,
                children: [
                    {
                        name: 'Child 1',
                    },
                ],
                fatalError: null,
                forceErrors: false,
                getPhrase: mockStores.layoutStore.getPhrase,
                hasDisabledStyles: false,
                infants: [
                    {
                        name: 'Infant 1',
                    },
                ],
                isOffersOptedIn: undefined,
                isPartnerOffersOptedIn: undefined,
                isSpecialOffersShown: undefined,
                nonFatalError: null,
                onClick: expect.any(Function),
                ignoreAnimation: false,
            });
        });

        it('should handle fatal customer login error correctly', () => {
            mockStores.guestDetailsStore.customerLogin = {
                firstError: {
                    isFatal: true,
                    title: 'fatal-error',
                    description: 'error',
                },
            };
            const {
                result: { current },
            } = renderHook(() => useGuestDetailsFull({ fields: {} } as IUseGuestDetailsFullProps));

            expect(current.fatalError).toBeTruthy();
            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith('fatal-error');
        });

        it('should handle non-fatal customer login error correctly', () => {
            mockStores.guestDetailsStore.customerLogin = {
                firstError: {
                    isFatal: false,
                    title: 'non-fatal-error',
                    description: 'error',
                },
            };
            const {
                result: { current },
            } = renderHook(() => useGuestDetailsFull({ fields: {} } as IUseGuestDetailsFullProps));

            expect(current.nonFatalError).toBeTruthy();
            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith('non-fatal-error');
        });

        it('should call toggleForceErrors on click when isFormValid is false', async () => {
            mockStores.guestDetailsStore.isFormValid = false;

            const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');

            const {
                result: { current },
            } = renderHook(() => useGuestDetailsFull({ fields: {} } as IUseGuestDetailsFullProps));

            current.onClick();

            expect(mockStores.guestDetailsStore.toggleForceErrors).toHaveBeenCalledWith(true);
            expect(mockStores.guestDetailsStore.setIsAddressLookup).toHaveBeenCalledWith(false);
            expect(requestAnimationFrameSpy).toHaveBeenCalled();
        });
    });

    describe('scrollIntoErrors', () => {
        it('should set ignore animation to true', () => {
            const setIgnoreAnimation = jest.fn();

            document.body.innerHTML = `
                <div class="will-be-invalid" data-status="expanded"></div>
            `;

            scrollIntoErrors({ setIgnoreAnimation });

            expect(setIgnoreAnimation).toHaveBeenCalledWith(true);
        });

        it('should expand collapsed blocks with errors', () => {
            const setIgnoreAnimation = jest.fn();

            document.body.innerHTML = `
                <div class="will-be-invalid" data-status="collapsed">
                    <button></button>
                </div>
            `;

            const buttonClickSpy = jest.spyOn(document.querySelector('button')!, 'click');

            scrollIntoErrors({ setIgnoreAnimation });

            expect(buttonClickSpy).toHaveBeenCalled();
        });

        it('should scroll to the first error element', async () => {
            const setIgnoreAnimation = jest.fn();

            document.body.innerHTML = `
                <div class="will-be-invalid">
                    <div class="error"></div>
                </div>
            `;

            jest.useFakeTimers();

            const smoothScrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

            scrollIntoErrors({ setIgnoreAnimation });

            jest.runAllTimers();

            expect(smoothScrollSpy).toHaveBeenCalled();
        });

        it('should not throw if no error elements are found', () => {
            const setIgnoreAnimation = jest.fn();

            document.body.innerHTML = '';

            expect(() => scrollIntoErrors({ setIgnoreAnimation })).not.toThrow();
        });
    });
});

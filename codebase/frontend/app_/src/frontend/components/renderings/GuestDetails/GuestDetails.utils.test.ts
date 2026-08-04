import { renderHook } from '@testing-library/react';

import { GuestDetailsPhase } from 'models/enum/GuestDetailsPhase';

import useGuestDetails, { IGuestPageFields } from './GuestDetails.utils';

const createStores = () => ({
    layoutStore: {
        isTradePortal: false,
        pageTitle: 'Guest Details',
        isSummaryBarEnabled: true,
        isSummaryBarHidden: false,
    },
    guestDetailsStore: {
        adults: [],
        initialize: jest.fn(() => true),
        clearGuestDetailsPhase: jest.fn(),
        saveGuestDetailsToSessionStorage: jest.fn(),
        guestDetailsPhase: GuestDetailsPhase.GuestsInfo,
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockStores = createStores();

describe('GuestDetails.utils', () => {
    describe('useGuestDetails', () => {
        it('should return correct data when fields are provided', () => {
            const fields = {
                HasSignInPrompt: { value: true },
                HidePageTitle: { value: false },
            } as IGuestPageFields;

            const {
                result: { current },
            } = renderHook(() => useGuestDetails({ fields }));

            expect(current).toEqual({
                isDisplayed: true,
                isAdvanced: true,
                pageTitle: 'Guest Details',
                isPageTitleVisible: true,
                isHolidaysLoading: false,
                isEmailVerificationShown: false,
                isGuestsInfoShown: true,
                isTradePortal: false,
                hasSignInPrompt: true,
            });
        });

        it('should set isPageTitleVisible to false when HidePageTitle is true', () => {
            const fields = {
                HasSignInPrompt: { value: true },
                HidePageTitle: { value: true },
            } as IGuestPageFields;

            const {
                result: { current },
            } = renderHook(() => useGuestDetails({ fields }));

            expect(current.pageTitle).toBe('Guest Details');
            expect(current.isPageTitleVisible).toBe(false);
        });

        it('should return correct data when fields are not provided', () => {
            const {
                result: { current },
            } = renderHook(() => useGuestDetails({ fields: undefined }));

            expect(current).toStrictEqual({
                isDisplayed: false,
                isAdvanced: true,
                pageTitle: 'Guest Details',
                isPageTitleVisible: true,
                isHolidaysLoading: false,
                isEmailVerificationShown: false,
                isGuestsInfoShown: true,
                isTradePortal: false,
                hasSignInPrompt: false,
            });
        });

        it('should call initialize and cleanup functions on mount and unmount', () => {
            const fields = {
                HasSignInPrompt: { value: true },
                HidePageTitle: { value: false },
            } as IGuestPageFields;

            const { unmount } = renderHook(() => useGuestDetails({ fields }));

            expect(mockStores.guestDetailsStore.initialize).toHaveBeenCalledWith(true);
            expect(mockStores.guestDetailsStore.saveGuestDetailsToSessionStorage).not.toHaveBeenCalled();

            unmount();

            expect(mockStores.guestDetailsStore.saveGuestDetailsToSessionStorage).toHaveBeenCalled();
            expect(mockStores.guestDetailsStore.clearGuestDetailsPhase).toHaveBeenCalled();
        });

        it('should set isHolidaysLoading to true when guestDetailsPhase is undefined', () => {
            mockStores.guestDetailsStore.guestDetailsPhase = undefined as unknown as GuestDetailsPhase;

            const {
                result: { current },
            } = renderHook(() => useGuestDetails({ fields: undefined }));

            expect(current.isHolidaysLoading).toBe(true);
        });

        it('should set isEmailVerificationShown to true when guestDetailsPhase is VerifyEmail', () => {
            mockStores.guestDetailsStore.guestDetailsPhase = GuestDetailsPhase.VerifyEmail;

            const {
                result: { current },
            } = renderHook(() => useGuestDetails({ fields: undefined }));

            expect(current.isEmailVerificationShown).toBe(true);
        });

        it('should set isGuestsInfoShown to true when guestDetailsPhase is GuestsInfo', () => {
            mockStores.guestDetailsStore.guestDetailsPhase = GuestDetailsPhase.GuestsInfo;

            const {
                result: { current },
            } = renderHook(() => useGuestDetails({ fields: undefined }));

            expect(current.isGuestsInfoShown).toBe(true);
        });
    });
});

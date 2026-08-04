import { waitFor } from '@testing-library/dom';

import { mockMonthsAvailability } from 'frontend/__mocks__/monthsAvailability';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';

import {
    handlePrefillSearchPod,
    handlePrefillSearchPodWithRecentSearch,
    IHandlePrefillSearchPodProps,
    IHandlePrefillSearchPodWithRecentSearchProps,
} from './usePrefillSearchPod.utils';

describe('usePrefillSearchPod.utils', () => {
    describe('handlePrefillSearchPod', () => {
        const createMockProps = (): IHandlePrefillSearchPodProps => ({
            from: null,
            monthsAvailability: mockMonthsAvailability,
            setIsMonthSearch: jest.fn(),
            to: null,
            updateAvailableDates: jest.fn(),
            updateAvailableDstCodes: jest.fn(),
            updateAvailableOrigins: jest.fn(),
            updateDestinationsDisplayValue: jest.fn(),
            updateOriginsDisplayValue: jest.fn(),
        });
        let mockProps: IHandlePrefillSearchPodProps;

        beforeEach(() => {
            mockProps = createMockProps();
        });

        it('should call all methods by default', async () => {
            handlePrefillSearchPod(mockProps);

            await waitFor(() => {
                expect(mockProps.updateAvailableOrigins).toHaveBeenCalledWith(true);
                expect(mockProps.updateAvailableDates).toHaveBeenCalledWith(!mockProps.monthsAvailability.length);
                expect(mockProps.updateAvailableDstCodes).toHaveBeenCalledWith(true);
                expect(mockProps.updateOriginsDisplayValue).toHaveBeenCalled();
                expect(mockProps.updateDestinationsDisplayValue).toHaveBeenCalled();
                expect(mockProps.setIsMonthSearch).toHaveBeenCalledWith(false);
            });
        });

        it('should not call setIsMonthSearch if from is not null', async () => {
            mockProps.from = new Date(2025, 10, 1);
            handlePrefillSearchPod(mockProps);

            await waitFor(() => {
                expect(mockProps.setIsMonthSearch).not.toHaveBeenCalled();
            });
        });

        it('should call updateAvailableDstCodes with false if shouldRefetchDestinationCodes is true', async () => {
            handlePrefillSearchPod({ ...mockProps, shouldRefetchDestinationCodes: true });

            await waitFor(() => {
                expect(mockProps.updateAvailableDstCodes).toHaveBeenCalledWith(false);
            });
        });

        it('should call updateAvailableDstCodes with true if shouldRefetchDestinationCodes is false', async () => {
            handlePrefillSearchPod({ ...mockProps, shouldRefetchDestinationCodes: false });

            await waitFor(() => {
                expect(mockProps.updateAvailableDstCodes).toHaveBeenCalledWith(true);
            });
        });
    });

    describe('handlePrefillSearchPodWithRecentSearch', () => {
        const createMockProps = (): IHandlePrefillSearchPodWithRecentSearchProps => ({
            from: null,
            monthsAvailability: mockMonthsAvailability,
            setIsMonthSearch: jest.fn(),
            to: null,
            updateAvailableDates: jest.fn(),
            updateAvailableDstCodes: jest.fn(),
            updateAvailableOrigins: jest.fn(),
            updateDestinationsDisplayValue: jest.fn(),
            updateOriginsDisplayValue: jest.fn(),
            getSearchParamsFromLocalStorage: jest.fn(() => null),
            prefillSearchParams: jest.fn(),
            clearSearchValues: jest.fn(),
            isReferer: false,
        });
        let mockProps: IHandlePrefillSearchPodWithRecentSearchProps;

        beforeEach(() => {
            mockProps = createMockProps();
        });

        it('should NOT prefill if getSearchParamsFromLocalStorage returns null', async () => {
            handlePrefillSearchPodWithRecentSearch(mockProps);

            await waitFor(() => {
                expect(mockProps.prefillSearchParams).not.toHaveBeenCalled();
            });
        });

        it('should prefill if prefilled data is correct', async () => {
            mockProps.getSearchParamsFromLocalStorage = jest.fn(
                () =>
                    ({
                        autoAllocation: false,
                        departure: 'BSL,GVA,ZRH',
                        dest: 'ALL',
                        durations: ['7'],
                        flexDays: 3,
                        geog: 'ALL',
                        rooms: [{ adults: 2 }],
                        startDate: '05-08-2023',
                    } as IPrefilledSearchParams),
            );

            handlePrefillSearchPodWithRecentSearch(mockProps);

            await waitFor(() => {
                expect(mockProps.prefillSearchParams).toHaveBeenCalled();
            });
        });

        it('should call all methods from handlePrefillSearchPod if getSearchParamsFromLocalStorage returns null', async () => {
            handlePrefillSearchPodWithRecentSearch(mockProps);

            await waitFor(() => {
                expect(mockProps.clearSearchValues).toHaveBeenCalled();
                expect(mockProps.updateAvailableOrigins).toHaveBeenCalledWith(true);
                expect(mockProps.updateAvailableDates).toHaveBeenCalledWith(!mockProps.monthsAvailability.length);
                expect(mockProps.updateAvailableDstCodes).toHaveBeenCalledWith(true);
                expect(mockProps.updateOriginsDisplayValue).toHaveBeenCalled();
                expect(mockProps.updateDestinationsDisplayValue).toHaveBeenCalled();
                expect(mockProps.setIsMonthSearch).toHaveBeenCalledWith(false);
            });
        });

        it('should not call setIsMonthSearch if from is not null', async () => {
            mockProps.from = new Date(2025, 10, 1);
            handlePrefillSearchPodWithRecentSearch(mockProps);

            await waitFor(() => {
                expect(mockProps.setIsMonthSearch).not.toHaveBeenCalled();
            });
        });

        it('should not call clearSearchValues if isReferer is true', async () => {
            mockProps.isReferer = true;
            handlePrefillSearchPodWithRecentSearch(mockProps);

            await waitFor(() => {
                expect(mockProps.clearSearchValues).not.toHaveBeenCalled();
            });
        });
    });
});

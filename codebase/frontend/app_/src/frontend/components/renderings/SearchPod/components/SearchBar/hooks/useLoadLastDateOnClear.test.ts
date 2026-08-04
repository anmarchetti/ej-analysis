import { renderHook } from '@testing-library/react';

import { IDisplayValue } from 'models/data/IDisplayValue';
import { useLoadLastDateOnClear } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useLoadLastDateOnClear';

let mockUsePreviousDestinationCodes: string[] | undefined;
let mockUsePreviousOriginsDisplayValue: IDisplayValue | undefined;
jest.mock(
    'frontend/hooks/usePrevious',
    () => (value: string[] | IDisplayValue | undefined) =>
        jest.fn(() => {
            if (Array.isArray(value)) {
                return mockUsePreviousDestinationCodes;
            }

            return mockUsePreviousOriginsDisplayValue;
        }),
);

describe('useLoadLastDateOnClear', () => {
    let mockLoadLastAvailableDate;

    beforeEach(() => {
        mockLoadLastAvailableDate = jest.fn();
        mockUsePreviousDestinationCodes = [];
        mockUsePreviousOriginsDisplayValue = { main: '' };
    });

    it('should call loadLastAvailableDate when FROM field is cleared and TO field was empty already', () => {
        mockUsePreviousDestinationCodes = ['ES'];

        renderHook(() =>
            useLoadLastDateOnClear({
                selectedDestinationCodes: [],
                originsDisplayValue: { main: '' },
                loadLastAvailableDate: mockLoadLastAvailableDate,
            }),
        );

        expect(mockLoadLastAvailableDate).toHaveBeenCalled();
    });

    it('should call loadLastAvailableDate when TO is cleared and FROM field was empty already', () => {
        mockUsePreviousOriginsDisplayValue = { main: 'test' };

        renderHook(() =>
            useLoadLastDateOnClear({
                selectedDestinationCodes: [],
                originsDisplayValue: { main: '' },
                loadLastAvailableDate: mockLoadLastAvailableDate,
            }),
        );

        expect(mockLoadLastAvailableDate).toHaveBeenCalled();
    });

    it('should not call loadLastAvailableDate when both fields are not empty', () => {
        mockUsePreviousDestinationCodes = ['ES'];
        mockUsePreviousOriginsDisplayValue = { main: 'test' };

        renderHook(() =>
            useLoadLastDateOnClear({
                selectedDestinationCodes: ['ES'],
                originsDisplayValue: { main: 'test' },
                loadLastAvailableDate: mockLoadLastAvailableDate,
            }),
        );

        expect(mockLoadLastAvailableDate).not.toHaveBeenCalled();
    });

    it('should not call loadLastAvailableDate when only one field was cleared', () => {
        mockUsePreviousDestinationCodes = ['ES'];
        mockUsePreviousOriginsDisplayValue = { main: 'test' };

        renderHook(() =>
            useLoadLastDateOnClear({
                selectedDestinationCodes: [],
                originsDisplayValue: { main: 'test' },
                loadLastAvailableDate: mockLoadLastAvailableDate,
            }),
        );

        expect(mockLoadLastAvailableDate).not.toHaveBeenCalled();
    });
});

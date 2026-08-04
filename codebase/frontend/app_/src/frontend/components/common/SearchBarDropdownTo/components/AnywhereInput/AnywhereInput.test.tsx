import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AnywhereInput from './AnywhereInput';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockCheckboxItemProps = jest.fn();
jest.mock('frontend/components/common/CheckboxItem/CheckboxItem', () => ({
    __esModule: true,
    default: ({ onChange, ...props }) => {
        mockCheckboxItemProps(props);

        return <button onClick={onChange} data-tid='checkbox-item' />;
    },
}));

const mockUseSearchPodStore = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    useSearchPodStore: () => mockUseSearchPodStore(),
}));

let mockStores;

describe('<AnywhereInput />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchStore: { searchTo: { isAnywhereSelected: false }, onAnywhereCheck: jest.fn() },
            trackingStore: {
                searchPod: {
                    trackToAnywhereSelect: jest.fn(),
                },
            },
        });
        mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: true });
    });

    it('should render standard', () => {
        render(<AnywhereInput />);

        expect(mockCheckboxItemProps).toHaveBeenCalledWith({
            code: 'anywhere',
            checked: mockStores.searchStore.searchTo.isAnywhereSelected,
            disabled: false,
            name: SitecoreDictionary.SearchPodLabelsAnywhere,
        });
    });

    it('should called onChangeOffersPriceView when click on checkbox', async () => {
        render(<AnywhereInput />);

        await userEvent.click(screen.getByTestId('checkbox-item'));

        expect(mockStores.searchStore.onAnywhereCheck).toHaveBeenCalled();
    });

    describe('Tracking', () => {
        it('should call trackToAnywhereSelect when checkbox is clicked and search pod is initialized', async () => {
            render(<AnywhereInput />);

            await userEvent.click(screen.getByTestId('checkbox-item'));

            expect(mockStores.trackingStore.searchPod.trackToAnywhereSelect).toHaveBeenCalledTimes(1);
        });

        it('should NOT call trackToAnywhereSelect when search pod is not initialized', async () => {
            mockUseSearchPodStore.mockReturnValue({ isSearchPodInitialized: false });

            render(<AnywhereInput />);

            await userEvent.click(screen.getByTestId('checkbox-item'));

            expect(mockStores.trackingStore.searchPod.trackToAnywhereSelect).not.toHaveBeenCalled();
        });

        it('should NOT call trackToAnywhereSelect when useSearchPodStore returns undefined', async () => {
            mockUseSearchPodStore.mockReturnValue(undefined);

            render(<AnywhereInput />);

            await userEvent.click(screen.getByTestId('checkbox-item'));

            expect(mockStores.trackingStore.searchPod.trackToAnywhereSelect).not.toHaveBeenCalled();
        });

        it('should call onAnywhereCheck before calling trackToAnywhereSelect', async () => {
            const callOrder: string[] = [];
            mockStores.searchStore.onAnywhereCheck = jest.fn(() => callOrder.push('onAnywhereCheck'));
            mockStores.trackingStore.searchPod.trackToAnywhereSelect = jest.fn(() =>
                callOrder.push('trackToAnywhereSelect'),
            );

            render(<AnywhereInput />);

            await userEvent.click(screen.getByTestId('checkbox-item'));

            expect(callOrder).toEqual(['onAnywhereCheck', 'trackToAnywhereSelect']);
        });

        it('should have trackToAnywhereSelect available in the component store hooks', () => {
            render(<AnywhereInput />);

            expect(mockStores.trackingStore.searchPod.trackToAnywhereSelect).toBeDefined();
            expect(typeof mockStores.trackingStore.searchPod.trackToAnywhereSelect).toBe('function');
        });
    });
});

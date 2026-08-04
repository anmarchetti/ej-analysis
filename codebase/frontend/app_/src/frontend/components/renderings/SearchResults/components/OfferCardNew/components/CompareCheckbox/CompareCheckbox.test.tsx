import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockCompareFields } from 'frontend/__mocks__/compare';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { IOfferWithActionFields } from 'frontend/components/renderings/CompareDeals/stores/CompareStore';

import CompareCheckbox from './CompareCheckbox';

const mockCheckboxProps = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => props => {
    mockCheckboxProps(props);

    return <div data-tid='checkbox' onClick={props.onChange} />;
});

jest.mock('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore'),
    useCompareStore: () => mockLocalStore,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    __esModule: true,
    getTimestamp: () => '2023-05-18_13:30:46',
}));

jest.mock('frontend/utils/tracking/trackOffer.utils', () => ({
    __esModule: true,
    createProduct: jest.fn().mockReturnValue({}),
}));

const createMockLocalStore = () => ({
    activateCompareMode: jest.fn(),
    updateComparisonList: jest.fn(),
    isCompareModeEnabled: true,
    isOfferSelectedToCompare: jest.fn().mockReturnValue(true),
    hasMaxItemsToCompare: true,
    compareDealsFields: mockCompareFields,
});

let mockLocalStore;
let mockStores;

const mockOffer: IOfferWithActionFields = {
    ...mockedOffer,
    shortlist: { id: '111' },
    link: '',
    onClickViewHoliday: jest.fn(),
};

describe('CompareCheckbox', () => {
    beforeEach(() => {
        mockLocalStore = createMockLocalStore();
        mockStores = createMockStores({
            layoutStore: {
                isCompareDealsEnabledOnSearchResultsPage: true,
                isSearchResultsPage: true,
            },
            trackingStore: {
                pageName: 'Search Results|FR-CH',
            },
        });
    });

    it('should handle potential null value from useCompareStore', () => {
        mockLocalStore = null;

        const { container } = render(<CompareCheckbox offer={mockOffer} />);

        expect(container).not.toBeEmptyDOMElement();
    });

    it('should not show checkbox on not search results', () => {
        mockStores.layoutStore.isSearchResultsPage = false;
        const { container } = render(<CompareCheckbox offer={mockOffer} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not show checkbox on search results page when compare deals functionality is disabled', () => {
        mockStores.layoutStore.isCompareDealsEnabledOnSearchResultsPage = false;

        const { container } = render(<CompareCheckbox offer={mockOffer} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render checked checkbox when offer selected to compare', () => {
        render(<CompareCheckbox offer={mockOffer} />);

        expect(mockCheckboxProps).toHaveBeenCalledWith(
            expect.objectContaining({
                checked: true,
                ariaLabel: mockOffer!.hotel!.name,
            }),
        );
    });

    it('should render unchecked checkbox when offer is not selected to compare', () => {
        mockLocalStore.isOfferSelectedToCompare = jest.fn().mockReturnValue(false);
        render(<CompareCheckbox offer={mockOffer} />);

        expect(mockCheckboxProps).toHaveBeenCalledWith(
            expect.objectContaining({
                checked: false,
            }),
        );
    });

    it('should call updateComparisonList and activateCompareMode if compare is not enabled when click on checkbox', () => {
        mockLocalStore.isOfferSelectedToCompare = jest.fn().mockReturnValue(false);
        mockLocalStore.isCompareModeEnabled = false;
        render(<CompareCheckbox offer={mockOffer} />);

        fireEvent.click(screen.getByTestId('checkbox'));

        expect(mockLocalStore.activateCompareMode).toHaveBeenCalled();
        expect(mockLocalStore.updateComparisonList).toHaveBeenCalledWith(mockOffer);
    });

    it('should not call activateCompareMode when compare enabled', () => {
        mockLocalStore.isOfferSelectedToCompare = jest.fn().mockReturnValue(false);

        render(<CompareCheckbox offer={mockOffer} />);

        fireEvent.click(screen.getByTestId('checkbox'));

        expect(mockLocalStore.activateCompareMode).not.toHaveBeenCalled();
        expect(mockLocalStore.updateComparisonList).toHaveBeenCalledWith(mockOffer);
    });

    it('should render disabled checkbox when hasMaxItemsToCompare and current offer is not selected', () => {
        mockLocalStore.isOfferSelectedToCompare = jest.fn().mockReturnValue(false);
        render(<CompareCheckbox offer={mockOffer} />);

        expect(mockCheckboxProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: true,
            }),
        );
    });

    it('should render enabled checkbox when hasMaxItemsToCompare but current offer selected', () => {
        render(<CompareCheckbox offer={mockOffer} />);

        expect(mockCheckboxProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: false,
            }),
        );
    });

    it('should render enabled checkbox when hasMaxItemsToCompare is false', () => {
        mockLocalStore.hasMaxItemsToCompare = false;

        render(<CompareCheckbox offer={mockOffer} />);

        expect(mockCheckboxProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: false,
            }),
        );
    });

    describe('tracking', () => {
        it('should call addToDataLayer when user add offer to compare', () => {
            mockLocalStore.isOfferSelectedToCompare = jest.fn().mockReturnValue(false);

            render(<CompareCheckbox offer={mockOffer} />);

            fireEvent.click(screen.getByTestId('checkbox'));

            expect(mockStores.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.CompareAdded,
                dimension13: '2023-05-18_13:30:46',
                dimension136: `${mockStores.trackingStore.pageName}`,
                products: [{}],
            });
        });

        it('should call addToDataLayer when user remove offer from compare', () => {
            mockLocalStore.isOfferSelectedToCompare = jest.fn().mockReturnValue(true);

            render(<CompareCheckbox offer={mockOffer} />);

            fireEvent.click(screen.getByTestId('checkbox'));

            expect(mockStores.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.CompareRemoved,
                dimension13: '2023-05-18_13:30:46',
                dimension136: `${mockStores.trackingStore.pageName}`,
                products: [{}],
            });
        });
    });
});

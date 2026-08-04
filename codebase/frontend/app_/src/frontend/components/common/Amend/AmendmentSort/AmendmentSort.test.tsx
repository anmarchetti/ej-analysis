import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AmendmentSort from 'frontend/components/common/Amend/AmendmentSort/AmendmentSort';

afterEach(cleanup);

const selectorElement: ISelectOption = {
    value: 'foo',
    label: 'test',
};

const createMockProps = () => ({
    options: [selectorElement],
    selectedSortOption: selectorElement,
    sortBy: AlternativeFlightsSortBy.OutboundEarliestDeparture,
    onChangeSortBy: jest.fn(),
    selectClassName: 'select-class',
    wrapperClassName: 'wrapperClass',
    isHotelChangeFlow: true,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewPort = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewPort,
}));

const mockAmendPageHeaderProps = jest.fn();
jest.mock('frontend/components/common/AmendPageHeader/AmendPageHeader', () => ({
    __esModule: true,
    default: props => {
        mockAmendPageHeaderProps(props);

        return <div data-tid='amend-header' />;
    },
}));

const mockAmendmentSortMobileProps = jest.fn();
jest.mock('frontend/components/common/Amend/AmendmentSort/AmendmentSortMobile', () => ({
    __esModule: true,
    default: props => {
        mockAmendmentSortMobileProps(props);

        return <div data-tid='amendment-sort-mobile' />;
    },
}));

const mockSelectProps = jest.fn();
jest.mock('react-select', () => ({
    __esModule: true,
    default: props => {
        mockSelectProps(props);

        return <div data-tid='select' />;
    },
}));

describe('<AmendmentSort>', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    it('should render Select component on desktop', () => {
        render(<AmendmentSort {...mockProps} />);

        expect(screen.getByTestId('select')).toBeInTheDocument();
        expect(mockSelectProps).toHaveBeenCalledWith(
            expect.objectContaining({
                options: mockProps.options,
                value: mockProps.selectedSortOption,
                onChange: expect.any(Function),
                isSearchable: false,
                components: expect.any(Object),
                blurInputOnSelect: true,
                maxMenuHeight: 250,
                selectProps: { hasCustomPlaceholder: false },
                placeholder: SitecoreDictionary.SearchResultsLabelsSortBy,
                className: 'custom-select select-class',
            }),
        );
    });

    it('should render AmendmentSortMobile component on mobile', () => {
        mockUseMobileViewPort = true;

        render(<AmendmentSort {...mockProps} />);

        expect(screen.getByTestId('amendment-sort-mobile')).toBeInTheDocument();
        expect(mockAmendmentSortMobileProps).toHaveBeenCalledWith(
            expect.objectContaining({
                options: mockProps.options,
                sortBy: mockProps.sortBy,
                onApplySortBy: mockProps.onChangeSortBy,
                isHotelChangeFlow: mockProps.isHotelChangeFlow,
                wrapperClassName: mockProps.wrapperClassName,
            }),
        );
    });

    describe('isDisabled', () => {
        it('should NOT render disabled Select component on desktop by default', () => {
            mockUseMobileViewPort = false;
            mockProps.isDisabled = false;

            render(<AmendmentSort {...mockProps} />);

            expect(screen.getByTestId('select')).toBeInTheDocument();
            expect(mockSelectProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isDisabled: false,
                }),
            );
        });

        it('should NOT render disabled AmendmentSortMobile component on mobile by default', () => {
            mockUseMobileViewPort = true;
            mockProps.isDisabled = false;

            render(<AmendmentSort {...mockProps} />);

            expect(screen.getByTestId('amendment-sort-mobile')).toBeInTheDocument();
            expect(mockAmendmentSortMobileProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isDisabled: false,
                }),
            );
        });

        it('should pass isDisabled prop to Select component on desktop', () => {
            mockUseMobileViewPort = false;
            mockProps.isDisabled = true;

            render(<AmendmentSort {...mockProps} />);

            expect(mockSelectProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isDisabled: true,
                }),
            );
        });

        it('should pass isDisabled prop to AmendmentSortMobile component on mobile', () => {
            mockUseMobileViewPort = true;
            mockProps.isDisabled = true;

            render(<AmendmentSort {...mockProps} />);

            expect(mockAmendmentSortMobileProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isDisabled: true,
                }),
            );
        });
    });

    it('should render wrapper class on desktop if provided', () => {
        mockUseMobileViewPort = false;
        const wrapperClassName = 'wrapper-class';
        mockProps.wrapperClassName = wrapperClassName;

        render(<AmendmentSort {...mockProps} />);

        expect(screen.getByTestId('select').parentElement).toHaveClass(wrapperClassName);
    });

    it('should render loading skeleton when isLoading is true', () => {
        mockProps.isLoading = true;

        render(<AmendmentSort {...mockProps} />);

        expect(screen.getByTestId('search-results-loading-skeleton-sort')).toBeInTheDocument();
    });

    it('should not render loading skeleton when isLoading is false', () => {
        mockProps.isLoading = false;

        render(<AmendmentSort {...mockProps} />);

        expect(screen.queryByTestId('search-results-loading-skeleton-sort')).not.toBeInTheDocument();
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendHotelOffer } from 'frontend/__mocks__';
import * as viewportUtils from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import NumberOfHotelsTitle from 'frontend/components/renderings/AmendHotel/components/AlternativeHotelsHeader/componetns/NumberOfHotelsTitle';

import AlternativeHotelsHeader, { IAlternativeHotelsHeaderProps } from './AlternativeHotelsHeader';

const createMockProps = (): IAlternativeHotelsHeaderProps => ({
    fields: {
        AlternativeHotelsTitle: mockSitecoreField('AlternativeHotelsTitle'),
        AlternativeHotelsSubtitle: mockSitecoreField('{number} hotels available'),
        PriceHighToLow: mockSitecoreField('PriceHighToLow'),
        PriceLowToHigh: mockSitecoreField('PriceLowToHigh'),
        TripAdvisor: mockSitecoreField('TripAdvisor'),
    } as any,
});

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUseMobileViewport = jest.spyOn(viewportUtils, 'useMobileViewport');

const mockAmendmentSortProps = jest.fn();
jest.mock('frontend/components/common/Amend/AmendmentSort/AmendmentSort', () => ({
    __esModule: true,
    default: props => {
        mockAmendmentSortProps(props);

        return <div data-tid='amendment-sort' />;
    },
}));
jest.mock('frontend/components/icons-new/Tick', () => () => <svg data-tid='svg-tick' />);
jest.mock(
    'frontend/components/renderings/AmendHotel/components/AlternativeHotelsHeader/componetns/NumberOfHotelsTitle',
    () => jest.fn(() => <svg data-tid='numbers-of-hotels' />),
);

describe('<AlternativeHotelsHeader />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendHotelStore: {
                selectedSortingOption: AlternativeHotelsSortingOptions.TripAdvisor,
                setSortingOption: jest.fn(),
                totalNumberOfHotels: 3,
                isLoading: false,
                alternativeHotels: [mockAmendHotelOffer, mockAmendHotelOffer, mockAmendHotelOffer],
                filters: {
                    toggleFilterMobileDrawer: jest.fn(),
                    selectedFilters: [],
                },
            },
        });
        mockProps = createMockProps();
    });

    it('should render components', () => {
        mockUseMobileViewport.mockReturnValue(false);
        render(<AlternativeHotelsHeader {...mockProps} />);

        expect(screen.getByText(mockProps.fields.AlternativeHotelsTitle.value)).toBeInTheDocument();
        expect(screen.queryByTestId('filter-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('numbers-of-hotels')).toBeInTheDocument();
        expect(screen.getByTestId('amendment-sort')).toBeInTheDocument();
        expect(mockAmendmentSortProps).toHaveBeenCalledWith({
            onChangeSortBy: mockStores.amendHotelStore.setSortingOption,
            options: [
                { label: mockProps.fields.PriceHighToLow.value, value: AlternativeHotelsSortingOptions.PriceHighToLow },
                { label: mockProps.fields.PriceLowToHigh.value, value: AlternativeHotelsSortingOptions.PriceLowToHigh },
                { label: mockProps.fields.TripAdvisor.value, value: AlternativeHotelsSortingOptions.TripAdvisor },
            ],
            sortBy: AlternativeHotelsSortingOptions.TripAdvisor,
            isHotelChangeFlow: true,
            selectedSortOption: {
                value: AlternativeHotelsSortingOptions.TripAdvisor,
                label: mockProps.fields.TripAdvisor.value,
            },
            isLoading: false,
            isDisabled: false,
        });
        expect(NumberOfHotelsTitle).toHaveBeenCalledWith(
            {
                className: 'subtitle',
                isLoading: false,
                shimmerClassName: 'numbersOfHotelsShimmer',
                title: '3 hotels available',
            },
            {},
        );
    });

    it('should pass state props to AmendmentSort when isLoading is true', () => {
        mockStores.amendHotelStore.isLoading = true;
        render(<AlternativeHotelsHeader {...mockProps} />);

        expect(mockAmendmentSortProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isDisabled: true,
                isLoading: true,
            }),
        );
    });

    it('should not render the subtitle when numberOfHotelsTitle is null', () => {
        render(<AlternativeHotelsHeader {...mockProps} />);

        expect(screen.queryByText('5 hotels available')).not.toBeInTheDocument();
    });

    it('should call toggleFilterMobileDrawer on filter button click', async () => {
        mockUseMobileViewport.mockReturnValue(true);
        render(<AlternativeHotelsHeader {...mockProps} />);

        await userEvent.click(screen.getByTestId('filter-button'));
        expect(mockStores.amendHotelStore.filters.toggleFilterMobileDrawer).toHaveBeenCalled();
    });

    it('should render the filter button with active icon when filters are selected', () => {
        mockUseMobileViewport.mockReturnValue(true);
        mockStores.amendHotelStore.filters.areFiltersSelected = true;
        render(<AlternativeHotelsHeader {...mockProps} />);

        const filterButton = screen.getByTestId('filter-button');
        expect(filterButton).toBeInTheDocument();
        expect(screen.getByTestId('svg-tick')).toBeInTheDocument();
    });

    it('should not render the active icon when no filters selected', () => {
        mockUseMobileViewport.mockReturnValue(true);

        render(<AlternativeHotelsHeader {...mockProps} />);

        const filterButton = screen.getByTestId('filter-button');
        expect(filterButton).toBeInTheDocument();
        expect(screen.queryByTestId('svg-tick')).not.toBeInTheDocument();
    });

    it('should wrap child with div when not on small screen', () => {
        mockUseMobileViewport.mockReturnValue(false);
        render(<AlternativeHotelsHeader {...mockProps} />);

        const countAndFilters = screen.getByTestId('count-and-filters');
        expect(countAndFilters).toBeInTheDocument();
        expect(countAndFilters).toHaveClass('countAndFilters');
    });

    it('should not wrap child with div when on small screen', () => {
        mockUseMobileViewport.mockReturnValue(true);
        render(<AlternativeHotelsHeader {...mockProps} />);

        expect(screen.queryByTestId('count-and-filters')).not.toBeInTheDocument();
    });

    it('should pass isLoading prop', () => {
        mockStores.amendHotelStore.isLoading = true;
        render(<AlternativeHotelsHeader {...mockProps} />);

        expect(NumberOfHotelsTitle).toHaveBeenCalledWith(
            expect.objectContaining({
                isLoading: true,
            }),
            {},
        );
        expect(mockAmendmentSortProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isLoading: true,
                isDisabled: true,
            }),
        );
    });
});

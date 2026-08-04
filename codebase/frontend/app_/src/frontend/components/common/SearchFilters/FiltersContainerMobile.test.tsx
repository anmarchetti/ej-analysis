import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FiltersContainerMobile from './FiltersContainerMobile';

const createProps = () => ({
    availableFilters: [{ code: FilterGroupCodes.Date }, { code: FilterGroupCodes.BoardType }],
    selectedFilters: [{ groupCode: FilterGroupCodes.Destination, preChecked: false }],
    isScreenExtraSmall: false,
    className: 'test-classname',
    onCloseFilters: jest.fn(),
    onSelectFilters: jest.fn(),
    onChangeFilters: jest.fn(),
    onCancel: jest.fn(),
    onApply: jest.fn(),
    onClearAllSelectedFilters: jest.fn(),
    onRemoveSelectedFilter: jest.fn(),
    filterTileClick: jest.fn(),
    activeFilterCode: FilterGroupCodes.FlightTimes,
    selectedDestinationCodesQuery: 'query',
    checkIsFilterSelected: jest.fn(),
    status: DataStatus.Loaded,
    priceFilterLabel: 'priceFilterLabel',
    isFilterGroupDisabled: jest.fn(),
    isBodyScrollLocked: false,
    isInDrawer: false,
    onOpenDrawer: jest.fn(),
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isBodyScrollLocked: false },
    appStore: { isScreenExtraSmall: false },
    bookingStore: { isValidatingPackage: false },
    searchFiltersStore: { clearSelectedFilterGroups: jest.fn() },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/FilterLined', () => () => <div data-tid='filter-lined' />);

jest.mock('frontend/components/icons-new/Tick', () => () => <div data-tid='tick' />);

jest.mock('frontend/components/common/SearchFilters/FilterTile', () => () => <div data-tid='filter-tile' />);

jest.mock('frontend/components/common/SearchFilters/FiltersDrawer', () => () => <div data-tid='filters-drawer' />);

jest.mock('frontend/components/common/SearchFilters/SelectedFilters', () => () => <div data-tid='selected-filters' />);

jest.mock('frontend/components/common/Drawer', () => ({ children }) => <div data-tid='drawer'>{children}</div>);

describe('<FiltersContainerMobile />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        Object.defineProperty(window, 'scrollTo', {
            configurable: true,
        });
        window.scrollTo = jest.fn();
    });

    it('should render container with test classname', () => {
        const { container } = render(<FiltersContainerMobile {...mockProps} />);

        expect(container.getElementsByClassName('test-classname').length).toBe(1);
    });

    it('should render 3 buttons', () => {
        const { getAllByRole } = render(<FiltersContainerMobile {...mockProps} />);

        expect(getAllByRole('button').length).toBe(3);
    });

    describe('First button', () => {
        it('should call onOpenDrawer after clicking first button when button is NOT disabled', async () => {
            const { getAllByRole } = render(<FiltersContainerMobile {...mockProps} />);

            const button = getAllByRole('button')[0];
            await userEvent.click(button);
            expect(mockProps.onOpenDrawer).toHaveBeenCalled();
        });

        it('should call onOpenDrawer only once after clicking first button 2 times', async () => {
            const { getAllByRole } = render(<FiltersContainerMobile {...mockProps} />);

            const button = getAllByRole('button')[0];
            await userEvent.click(button);
            await userEvent.click(button);
            expect(mockProps.onOpenDrawer).toHaveBeenCalledTimes(1);
        });

        it('should render SvgFilterLined icon', () => {
            const { getAllByRole, getByTestId } = render(<FiltersContainerMobile {...mockProps} />);

            const button = getAllByRole('button')[0];
            expect(button).toContainElement(getByTestId('filter-lined'));
        });

        it('should render SearchPodFiltersTitlesFilters label', () => {
            const { getAllByRole, getByText } = render(<FiltersContainerMobile {...mockProps} />);

            const button = getAllByRole('button')[0];
            expect(button).toContainElement(getByText(SitecoreDictionary.SearchPodFiltersTitlesFilters));
        });

        it('should render SvgTick icon when at least 1 selected filter is provided', () => {
            const { getAllByRole, getByTestId } = render(<FiltersContainerMobile {...mockProps} />);

            const button = getAllByRole('button')[0];
            expect(button).toContainElement(getByTestId('tick'));
        });

        it('should NOT render SvgTick icon when there is 0 selected filters', () => {
            mockProps.selectedFilters = [];
            const { getAllByRole, queryByTestId } = render(<FiltersContainerMobile {...mockProps} />);

            const button = getAllByRole('button')[0];
            expect(button).not.toContainElement(queryByTestId('tick'));
        });
    });

    it('should render drawer', () => {
        const { getByTestId } = render(<FiltersContainerMobile {...mockProps} />);

        expect(getByTestId('drawer')).toBeInTheDocument();
    });

    it('should render 2 FilterTiles', () => {
        const { getAllByTestId } = render(<FiltersContainerMobile {...mockProps} />);

        expect(getAllByTestId('filter-tile').length).toBe(2);
    });

    it('should NOT render FilterTile when all available filters have TripAdvisorRating group code', () => {
        mockProps.availableFilters[0].code = FilterGroupCodes.TripAdvisorRating;
        mockProps.availableFilters[1].code = FilterGroupCodes.TripAdvisorRating;
        const { queryByTestId } = render(<FiltersContainerMobile {...mockProps} />);

        expect(queryByTestId('filter-tile')).not.toBeInTheDocument();
    });

    it('should render SelectedFilters', () => {
        const { getByTestId } = render(<FiltersContainerMobile {...mockProps} />);

        expect(getByTestId('selected-filters')).toBeInTheDocument();
    });

    it('should render GlobalsButtonsClose label on second button', () => {
        const { getByText, getAllByRole } = render(<FiltersContainerMobile {...mockProps} />);

        const button = getAllByRole('button')[1];
        expect(button).toContainElement(getByText(SitecoreDictionary.GlobalsButtonsClose));
    });

    it('should render SearchPodFiltersButtonsApplyAndSeeResults label on third button', () => {
        const { getByText, getAllByRole } = render(<FiltersContainerMobile {...mockProps} />);

        const button = getAllByRole('button')[2];
        expect(button).toContainElement(getByText(SitecoreDictionary.SearchPodFiltersButtonsApplyAndSeeResults));
    });
});

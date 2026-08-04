import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FiltersDrawer from './FiltersDrawer';

const createProps = () => ({
    availableFilters: [],
    activeFilterCode: FilterGroupCodes.BoardType,
    onSelectFilters: jest.fn(),
    onApplyFilters: jest.fn(),
    onCancel: jest.fn(),
    onApply: jest.fn(),
    onCloseFilters: jest.fn(),
    selectedDestinationCodesQuery: 'query',
    selectedFilters: [],
    status: DataStatus.Loaded,
    checkIsFilterSelected: jest.fn(),
    isPromoPage: false,
});

const createStores = () => ({
    layoutStore: { isPromoPage: false, getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/SearchFilters/FilterContent', () => () => <div data-tid='filter-content' />);

jest.mock('frontend/components/common/Drawer', () => ({ children }) => <div data-tid='drawer'>{children}</div>);

describe('<FiltersDrawer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render drawer', () => {
        const { getByTestId } = render(<FiltersDrawer {...mockProps} />);

        expect(getByTestId('drawer')).toBeInTheDocument();
    });

    it('should render FilterContent', () => {
        const { getByTestId } = render(<FiltersDrawer {...mockProps} />);

        expect(getByTestId('filter-content')).toBeInTheDocument();
    });

    it('should NOT render FilterTypesTextDurationFilterText when active filter code is NOT Duration', () => {
        const { queryByText } = render(<FiltersDrawer {...mockProps} />);

        expect(queryByText(SitecoreDictionary.FilterTypesTextDurationFilterText)).not.toBeInTheDocument();
    });

    it('should render FilterTypesTextDurationFilterText when active filter code is Duration', () => {
        mockProps.activeFilterCode = FilterGroupCodes.Duration;
        const { getByText } = render(<FiltersDrawer {...mockProps} />);

        expect(getByText(SitecoreDictionary.FilterTypesTextDurationFilterText)).toBeInTheDocument();
    });

    it('should render 2 buttons', () => {
        const { getAllByRole } = render(<FiltersDrawer {...mockProps} />);

        expect(getAllByRole('button').length).toBe(2);
    });

    it('should render SearchPodFiltersButtonsClose in first button', () => {
        const { getAllByRole, getByText } = render(<FiltersDrawer {...mockProps} />);

        const button = getAllByRole('button')[0];
        expect(button).toContainElement(getByText(SitecoreDictionary.GlobalsButtonsClose));
    });

    it('should call onCancel when clicking 1st button', async () => {
        const { getAllByRole } = render(<FiltersDrawer {...mockProps} />);

        const button = getAllByRole('button')[0];
        await userEvent.click(button);
        expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('should render GlobalsButtonsApply in second button', () => {
        const { getAllByRole, getByText } = render(<FiltersDrawer {...mockProps} />);

        const button = getAllByRole('button')[1];
        expect(button).toContainElement(getByText(SitecoreDictionary.GlobalsButtonsApply));
    });

    it('should call onApply when clicking 2nd button', async () => {
        const { getAllByRole } = render(<FiltersDrawer {...mockProps} />);

        const button = getAllByRole('button')[1];
        await userEvent.click(button);
        expect(mockProps.onApply).toHaveBeenCalled();
    });

    it('should call onCloseFilters when clicking 2nd button and onApply method NOT provided', async () => {
        mockProps.onApply = undefined;
        const { getAllByRole } = render(<FiltersDrawer {...mockProps} />);

        const button = getAllByRole('button')[1];
        await userEvent.click(button);
        expect(mockProps.onCloseFilters).toHaveBeenCalled();
    });
});

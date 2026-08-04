import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as utils from 'frontend/utils/filter.utils';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FilterTile, { IFilterTitleProps } from './FilterTitle';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons/ChevronUp', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-up' />,
}));

jest.mock('frontend/components/icons/ChevronDown', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-down' />,
}));

jest.mock('./FilterTitleClear', () => ({
    __esModule: true,
    default: () => <div data-tid='filter-title-clear' />,
}));

const mockGetFilterTitle = jest
    .spyOn(utils, 'getFilterTitle')
    .mockReturnValue(SitecoreDictionary.FilterTypesLabelsBoard);

describe('<FilterTile />', () => {
    const resetMocks = (): IFilterTitleProps => ({
        code: FilterGroupCodes.BoardType,
        onClick: jest.fn(),
        isActive: false,
        isDisabled: false,
        countableFilters: undefined,
        onRemoveAllFilterGroup: jest.fn(),
        name: FilterGroupCodes.BoardType,
    });

    let mocks;

    beforeEach(() => {
        mockStores = createStores();
        mocks = resetMocks();
    });

    it('should render FilterTitleClear and title from getFilterTitle', () => {
        render(<FilterTile {...mocks} />);

        expect(screen.getByTestId('filter-title-clear')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.FilterTypesLabelsBoard)).toBeInTheDocument();
    });

    it('should render empty title when getFilterTitle returns empty string', () => {
        mockGetFilterTitle.mockReturnValueOnce('');

        render(<FilterTile {...mocks} />);

        expect(screen.queryByText(SitecoreDictionary.FilterTypesLabelsBoard)).not.toBeInTheDocument();
    });

    it('should render SvgChevronDown when is NOT active', () => {
        render(<FilterTile {...mocks} />);

        expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
        expect(screen.getByTestId('filter-title-icon')).not.toHaveClass('icon--active');
    });

    it('should render SvgChevronUp when is active', () => {
        mocks.isActive = true;

        render(<FilterTile {...mocks} />);

        expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
        expect(screen.getByTestId('filter-title-icon')).toHaveClass('icon--active');
    });

    it('should call onClick on button click when button is NOT disabled', async () => {
        render(<FilterTile {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mocks.onClick).toHaveBeenCalledWith(mocks.code);
    });

    it('should NOT call onClick on button click when button is disabled', async () => {
        mocks.isDisabled = true;

        render(<FilterTile {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mocks.onClick).not.toHaveBeenCalled();
    });
});

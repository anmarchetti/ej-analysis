import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RecentSearchItem from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearchItem/RecentSearchItem';

const createProps = () => ({
    item: { from: 'from', to: 'to', when: 'when', duration: 'duration', who: 'who' },
    onClick: jest.fn(),
    onClear: jest.fn(),
    isSelected: false,
    isLoadingDestination: false,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/Cross', () => () => <div data-tid='cross' />);

jest.mock('frontend/components/icons/ChevronRight', () => () => <div data-tid='chevron' />);

describe('<RecentSearchItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render RecentSearchItem without selected classname when is NOT selected', () => {
        const { getByTestId } = render(<RecentSearchItem {...mockProps} />);

        expect(getByTestId('recent-search-item')).not.toHaveClass('selected');
    });

    it('should render RecentSearchItem with selected classname when is selected', () => {
        mockProps.isSelected = true;
        const { getByTestId } = render(<RecentSearchItem {...mockProps} />);

        expect(getByTestId('recent-search-item-content')).toBeInTheDocument();
        expect(getByTestId('recent-search-item')).toHaveClass('selected');
    });

    it('should render 2 buttons', () => {
        const { getAllByRole } = render(<RecentSearchItem {...mockProps} />);

        expect(getAllByRole('button').length).toBe(2);
    });

    it('should render cross icon in 1st button', () => {
        const { getAllByRole, getByTestId } = render(<RecentSearchItem {...mockProps} />);

        expect(getAllByRole('button')[0]).toContainElement(getByTestId('cross'));
    });

    it('should call onClear after clicking 1st button', async () => {
        const { getAllByRole } = render(<RecentSearchItem {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        expect(mockProps.onClear).toHaveBeenCalled();
    });

    it('should call onClick after clicking 2nd button', async () => {
        const { getAllByRole } = render(<RecentSearchItem {...mockProps} />);

        await userEvent.click(getAllByRole('button')[1]);
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should render from in 2nd button', () => {
        const { getAllByRole, getByText } = render(<RecentSearchItem {...mockProps} />);

        expect(getAllByRole('button')[1]).toContainElement(getByText('from'));
    });

    it('should render when and duration in 2nd button', () => {
        const { getAllByRole, getByText } = render(<RecentSearchItem {...mockProps} />);

        expect(getAllByRole('button')[1]).toContainElement(getByText('when, duration'));
    });

    it('should render who in 2nd button', () => {
        const { getAllByRole, getByText } = render(<RecentSearchItem {...mockProps} />);

        expect(getAllByRole('button')[1]).toContainElement(getByText('who'));
    });

    it('should render to in 2nd button when destination is not loading', () => {
        const { getAllByRole, getByText } = render(<RecentSearchItem {...mockProps} />);

        expect(getAllByRole('button')[1]).toContainElement(getByText('to'));
    });

    it('should render placeholder-shimmer in 2nd button when destination is loading', () => {
        mockProps.isLoadingDestination = true;
        const { getAllByRole, container } = render(<RecentSearchItem {...mockProps} />);

        const placeholder = container.getElementsByClassName('placeholder-shimmer')[0];
        expect(getAllByRole('button')[1]).toContainElement(placeholder as any);
    });

    it('should render chevron icon in 2nd button', () => {
        const { getAllByRole, getByTestId } = render(<RecentSearchItem {...mockProps} />);

        expect(getAllByRole('button')[1]).toContainElement(getByTestId('chevron'));
    });
});

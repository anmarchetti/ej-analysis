import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { switchTabOnArrowPress } from 'frontend/utils/a11y.utils';

import FacilitiesTabsList from './FacilitiesTabsList';

const createProps = () => ({
    facilityGroups: [
        { name: 'group1', iconUrl: 'url1', id: '1' },
        { name: 'group2', iconUrl: 'url2', id: '2' },
        { name: 'group3', iconUrl: 'url3', id: '3' },
    ],
    activeTabIndex: 1,
    setActiveTabIndex: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/utils/a11y.utils', () => ({
    switchTabOnArrowPress: jest.fn(),
}));

jest.mock('frontend/components/icons-new/ChevronRight', () => () => <div data-tid='icon' />);

describe('<FacilitiesTabsList />', () => {
    beforeEach(() => {
        mockProps = createProps();
        (switchTabOnArrowPress as jest.Mock).mockReturnValue(undefined);
    });

    it('should render tabs list', () => {
        const { getByRole } = render(<FacilitiesTabsList {...mockProps} />);

        expect(getByRole('tablist')).toBeInTheDocument();
    });

    it('should render 3 list items', () => {
        const { getAllByRole } = render(<FacilitiesTabsList {...mockProps} />);

        expect(getAllByRole('presentation').length).toBe(3);
    });

    it('should render 3 buttons', () => {
        const { getAllByRole } = render(<FacilitiesTabsList {...mockProps} />);

        expect(getAllByRole('tab').length).toBe(3);
    });

    it('should render 3 icons when iconUrls provided', () => {
        const { container } = render(<FacilitiesTabsList {...mockProps} />);

        expect(container.getElementsByClassName('icon').length).toBe(3);
    });

    it('should render all tabs names', () => {
        const { getByText } = render(<FacilitiesTabsList {...mockProps} />);

        expect(getByText('group1')).toBeInTheDocument();
        expect(getByText('group2')).toBeInTheDocument();
        expect(getByText('group3')).toBeInTheDocument();
    });

    it('should render 3 chevron right icons', () => {
        const { getAllByTestId } = render(<FacilitiesTabsList {...mockProps} />);

        expect(getAllByTestId('icon').length).toBe(3);
    });

    it('should NOT render tabs when tabs NOT provided', () => {
        mockProps.facilityGroups = [];
        const { queryByRole } = render(<FacilitiesTabsList {...mockProps} />);

        expect(queryByRole('presentation')).not.toBeInTheDocument();
    });

    it('should NOT render icons when iconUrls NOT provided', () => {
        mockProps.facilityGroups = [
            { name: 'group1', iconUrl: null, id: '1' },
            { name: 'group2', id: '2' },
            { name: 'group3', iconUrl: '', id: '3' },
        ];
        const { container } = render(<FacilitiesTabsList {...mockProps} />);

        expect(container.getElementsByClassName('icon').length).toBe(0);
    });

    it('should set active class on the active tab', () => {
        const { getAllByRole } = render(<FacilitiesTabsList {...mockProps} />);
        const tabs = getAllByRole('tab');

        expect(tabs[1]).toHaveClass('active');
        expect(tabs[0]).not.toHaveClass('active');
        expect(tabs[2]).not.toHaveClass('active');
    });

    it('should set aria-selected true only on active tab', () => {
        const { getAllByRole } = render(<FacilitiesTabsList {...mockProps} />);
        const tabs = getAllByRole('tab');

        expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
        expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
        expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('should set tabIndex 0 on active tab and -1 on others', () => {
        const { getAllByRole } = render(<FacilitiesTabsList {...mockProps} />);
        const tabs = getAllByRole('tab');

        expect(tabs[0]).toHaveAttribute('tabindex', '-1');
        expect(tabs[1]).toHaveAttribute('tabindex', '0');
        expect(tabs[2]).toHaveAttribute('tabindex', '-1');
    });

    it('should call setActiveTabIndex on tab click', () => {
        const { getAllByRole } = render(<FacilitiesTabsList {...mockProps} />);
        const tabs = getAllByRole('tab');

        fireEvent.click(tabs[2]);

        expect(mockProps.setActiveTabIndex).toHaveBeenCalledWith(2);
    });

    it('should call setActiveTabIndex on arrow key press when newIndex is returned', () => {
        (switchTabOnArrowPress as jest.Mock).mockReturnValue(2);
        const { getByRole } = render(<FacilitiesTabsList {...mockProps} />);

        fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowDown' });

        expect(mockProps.setActiveTabIndex).toHaveBeenCalledWith(2);
    });

    it('should NOT call setActiveTabIndex on arrow key press when newIndex is undefined', () => {
        (switchTabOnArrowPress as jest.Mock).mockReturnValue(undefined);
        const { getByRole } = render(<FacilitiesTabsList {...mockProps} />);

        fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowLeft' });

        expect(mockProps.setActiveTabIndex).not.toHaveBeenCalled();
    });
});

import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ItineraryItem, { TItineraryItemProps } from './ItineraryItem';

const createProps = (): TItineraryItemProps => ({
    children: <div data-tid='children' />,
    icon: <div data-tid='icon' />,
    title: mockSitecoreField('Title'),
    hideSeparator: false,
    isExpanded: false,
    setExpanded: jest.fn(),
    canExpand: true,
    isGreyedOut: false,
});

let props: TItineraryItemProps;

describe('<ItineraryItem />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render', () => {
        render(<ItineraryItem {...props} />);

        expect(screen.getByTestId('itinerary-item')).toBeInTheDocument();
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByTestId('itinerary-item-icon')).toBeInTheDocument();
    });

    it('should render separator with hidden class when hideSeparator is true', () => {
        props.hideSeparator = true;

        render(<ItineraryItem {...props} />);

        const separator = screen.getByTestId('itinerary-item-separator');
        expect(separator).toBeInTheDocument();
        expect(separator).toHaveClass('hidden');
    });

    it('should render separator without hidden class when hideSeparator is false', () => {
        render(<ItineraryItem {...props} />);

        const separator = screen.getByTestId('itinerary-item-separator');
        expect(separator).toBeInTheDocument();
        expect(separator).not.toHaveClass('hidden');
    });

    it('should render expand button when canExpand is true', () => {
        render(<ItineraryItem {...props} />);

        expect(screen.getByTestId('itinerary-item-expand-button')).toBeInTheDocument();
    });

    it('should not render expand button when canExpand is false', () => {
        props.canExpand = false;
        render(<ItineraryItem {...props} />);

        expect(screen.queryByTestId('itinerary-item-expand-button')).not.toBeInTheDocument();
    });

    it('should apply expanded class to chevron when isExpanded is true', () => {
        props.isExpanded = true;
        render(<ItineraryItem {...props} />);

        const button = screen.getByTestId('itinerary-item-expand-button');
        const chevron = button.querySelector('svg');
        expect(chevron).toHaveClass('expanded');
    });

    it('should not apply expanded class to chevron when isExpanded is false', () => {
        render(<ItineraryItem {...props} />);

        const button = screen.getByTestId('itinerary-item-expand-button');
        const chevron = button.querySelector('svg');
        expect(chevron).not.toHaveClass('expanded');
    });

    it('should apply greyedOut class when isGreyedOut is true', () => {
        props.isGreyedOut = true;
        render(<ItineraryItem {...props} />);

        expect(screen.getByTestId('itinerary-item')).toHaveClass('greyedOut');
    });

    it('should not apply greyedOut class when isGreyedOut is false', () => {
        render(<ItineraryItem {...props} />);

        expect(screen.getByTestId('itinerary-item')).not.toHaveClass('greyedOut');
    });

    it('should hide children when isGreyedOut is true and isExpanded is false', () => {
        props.isGreyedOut = true;
        props.isExpanded = false;
        render(<ItineraryItem {...props} />);

        expect(screen.queryByTestId('children')).not.toBeInTheDocument();
    });

    it('should show children when isExpanded is true regardless of isGreyedOut', () => {
        props.isGreyedOut = true;
        props.isExpanded = true;
        render(<ItineraryItem {...props} />);

        expect(screen.getByTestId('children')).toBeInTheDocument();
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { IPointOfInterest } from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import SinglePointCard from './SinglePointCard';

const createProps = (): IPointOfInterest => ({
    distance: '10km',
    name: 'name',
    categoryName: 'category',
});

let mockProps;

jest.mock('frontend/components/icons-new/GreyPin', () => ({
    __esModule: true,
    default: () => <div data-tid='grey-pin' />,
}));

describe('<SinglePointCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<SinglePointCard {...mockProps} />);

        expect(screen.getByTestId('point-of-interest-name')).toHaveTextContent('name');
        expect(screen.getByTestId('point-of-interest-category')).toHaveTextContent('category');
        expect(screen.getByTestId('point-of-interest-distance')).toHaveTextContent('10km');
        expect(screen.getByTestId('grey-pin')).toBeInTheDocument();
        expect(screen.getByTestId('point-of-interest-distance-wrapper')).toBeInTheDocument();
    });

    it('should NOT render distance and grey pin when distance is NOT provided', () => {
        mockProps.distance = '';

        render(<SinglePointCard {...mockProps} />);

        expect(screen.queryByTestId('point-of-interest-distance')).not.toBeInTheDocument;
        expect(screen.queryByTestId('grey-pin')).not.toBeInTheDocument();
    });

    it('should NOT render name when name is NOT provided', () => {
        mockProps.name = '';

        render(<SinglePointCard {...mockProps} />);

        expect(screen.queryByTestId('point-of-interest-name')).not.toBeInTheDocument();
    });

    it('should NOT render categoryName when categoryName is NOT provided', () => {
        mockProps.categoryName = '';

        render(<SinglePointCard {...mockProps} />);

        expect(screen.queryByTestId('point-of-interest-category')).not.toBeInTheDocument();
    });
});

import React from 'react';
import { render } from '@testing-library/react';

import ItineraryItem from './ItineraryItem';

import styles from './ItineraryItem.module.scss';

const createMockStores = () => ({
    appStore: {
        isScreenLessMedium: false,
    },
    layoutStore: {
        isEditMode: false,
        getPhrase: jest.fn(p => p),
    },
});

const createProps = () => ({
    Name: { value: 'Name' },
    Duration: { value: 'Duration' },
    TotalDistance: { value: 'TotalDistance' },
    itinerary: [
        {
            fields: {
                RouteType: { value: 'Car' },
            },
        },
        {
            fields: {
                RouteType: { value: 'Bus' },
            },
        },
    ],
    Description: { value: 'Description' },
    onOpenRouteMap: jest.fn(),
    id: 'id',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ItineraryItem />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render passed props', () => {
        const { getByText, getByTestId } = render(<ItineraryItem {...mockProps} />);

        expect(getByText('Name')).toBeInTheDocument();
        expect(getByText('Duration')).toBeInTheDocument();
        expect(getByText('Globals.Labels.Time.HoursPluralAbbr')).toBeInTheDocument();
        expect(getByText('Car or Bus')).toBeInTheDocument();
        expect(getByText('TotalDistance')).toBeInTheDocument();
        expect(getByText('Map.Kilometer')).toBeInTheDocument();
        expect(getByText('Description')).toBeInTheDocument();
        expect(getByText('Itineraries.Buttons.OpenRoute')).toBeInTheDocument();
        expect(getByTestId('location-number')).toHaveTextContent('2');
    });

    it('Should render styles.tourRoutesCard class', () => {
        const { container } = render(<ItineraryItem {...mockProps} />);

        expect(container.getElementsByClassName(styles.tourRoutesCard).length).toBe(1);
    });

    it('Should render styles.background class', () => {
        const { container } = render(<ItineraryItem {...mockProps} />);

        expect(container.getElementsByClassName(styles.background).length).toBe(1);
    });

    it('Should render styles.content class', () => {
        const { container } = render(<ItineraryItem {...mockProps} />);

        expect(container.getElementsByClassName(styles.content).length).toBe(1);
    });

    it('Should render styles.title class', () => {
        const { container } = render(<ItineraryItem {...mockProps} />);

        expect(container.getElementsByClassName(styles.title).length).toBe(1);
    });

    it('Should render styles.description class', () => {
        const { getByText } = render(<ItineraryItem {...mockProps} />);

        expect(getByText('Description')).toHaveClass(styles.description);
    });

    it('Should render styles.button class', () => {
        const { getByText } = render(<ItineraryItem {...mockProps} />);

        expect(getByText('Itineraries.Buttons.OpenRoute')).toHaveClass(styles.button);
    });
});

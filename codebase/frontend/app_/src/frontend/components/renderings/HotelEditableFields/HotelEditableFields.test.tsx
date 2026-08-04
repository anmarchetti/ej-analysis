import React from 'react';
import { render, screen } from '@testing-library/react';

import HotelEditableFields from './HotelEditableFields';

const createStores = (overrides = {}) => ({
    layoutStore: {
        isEditMode: true,
        pageFields: {
            PageTitle: { value: 'title' },
            Longitude: { value: 'description' },
            Latitude: { value: 'latitude' },
            StarRating: { value: 'star rating' },
            TripAdvisorId: { value: 'trip advisor id' },
        },
        ...overrides,
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: (props: any) => {
        mockText(props);

        return <span data-tid='sc-text'>{props.field?.value}</span>;
    },
}));

describe('<HotelEditableFields/>', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should return null if there are no fields', () => {
        mockStores = createStores({ pageFields: undefined });

        const { container } = render(<HotelEditableFields />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component if there is Edit Mode', () => {
        const { container } = render(<HotelEditableFields />);

        expect(container.querySelector('.editable-fields')).toBeInTheDocument();
        expect(screen.getAllByTestId('sc-text')).toHaveLength(5);

        expect(screen.getByText(/Metadata Title:/)).toBeInTheDocument();
        expect(screen.getByText(/Longitude:/)).toBeInTheDocument();
        expect(screen.getByText(/Latitude:/)).toBeInTheDocument();
        expect(screen.getByText(/Star Rating:/)).toBeInTheDocument();
        expect(screen.getByText(/TripAdvisor ID:/)).toBeInTheDocument();
    });

    it('should not render if there is no Edit Mode', () => {
        mockStores = createStores({ isEditMode: false });

        const { container } = render(<HotelEditableFields />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component if there is Edit Mode and all fields are empty', () => {
        mockStores = createStores({
            pageFields: {
                PageTitle: { value: '' },
                Longitude: { value: '' },
                Latitude: { value: '' },
                StarRating: { value: '' },
                TripAdvisorId: { value: '' },
            },
        });

        const { container } = render(<HotelEditableFields />);

        expect(container.querySelector('.editable-fields')).toBeInTheDocument();
        expect(screen.getAllByTestId('sc-text')).toHaveLength(5);
    });
});

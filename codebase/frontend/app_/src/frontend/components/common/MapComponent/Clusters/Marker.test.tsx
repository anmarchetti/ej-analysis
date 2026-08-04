import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IGeoPoint } from 'models/data/map/IMap';

import * as utils from './ClusteredMarkers.utils';
import Marker, { IMarkerProps } from './Marker';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAdvancedMarkerComponent = jest.fn();
jest.mock('@vis.gl/react-google-maps', () => ({
    __esModule: true,
    ...jest.requireActual('@vis.gl/react-google-maps'),
    AdvancedMarker: ({ children, ...props }) => {
        mockAdvancedMarkerComponent(props);

        return <div data-tid='marker'>{children}</div>;
    },
}));

jest.mock('frontend/components/icons-new/RoundedPointer', () => ({
    __esModule: true,
    default: () => <div data-tid='rounded-pointer' />,
}));

const getFormattedPriceSpy = jest.spyOn(utils, 'getFormattedPrice');

let mockStores;
let mockProps: IMarkerProps;

describe('Marker', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                isPriceFilterPerPerson: false,
            },
        });

        mockProps = {
            onClick: jest.fn(),
            zIndex: 10,
            selected: false,
            item: {
                geometry: {
                    type: 'Point',
                    coordinates: [1.689, 12.678],
                },
                properties: {
                    id: '1',
                    name: '',
                    price: 1000,
                    pricePP: 500,
                },
            } as IGeoPoint,
        };
    });

    it('should render marker with name when provided', () => {
        mockProps.item.properties.name = 'Test Marker';

        render(<Marker {...mockProps} />);

        expect(screen.getByText('Test Marker')).toBeInTheDocument();
        expect(screen.getByTestId('rounded-pointer')).toBeInTheDocument();
    });

    it('should render marker with price when provided', () => {
        mockProps.item.properties.price = 1000;

        render(<Marker {...mockProps} />);

        expect(screen.getByText('£1000')).toBeInTheDocument();
        expect(screen.getByTestId('rounded-pointer')).toBeInTheDocument();
    });

    it('should NOT render price when name are provided', () => {
        mockProps.item.properties.name = 'Test Marker';
        mockProps.item.properties.price = 1000;

        render(<Marker {...mockProps} />);

        expect(screen.getByText('Test Marker')).toBeInTheDocument();
        expect(screen.queryByText('£1000')).toBeNull();
    });

    it('should render default icon when name and price are not provided', () => {
        mockProps.item.properties.name = undefined;
        mockProps.item.properties.price = undefined;

        const { container } = render(<Marker {...mockProps} />);

        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render price per person when isPricePerPerson is true', () => {
        mockStores.layoutStore.isSearchResultsPage = true;
        mockStores.searchFiltersStore.isPriceFilterPerPerson = true;
        mockProps.item.properties.pricePP = 500;

        render(<Marker {...mockProps} />);

        expect(getFormattedPriceSpy).toHaveBeenCalledWith(expect.objectContaining({ isPricePerPerson: true }));
    });

    it('should not render price when prices are hidden and trade-portal is true', () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.layoutStore.isPricesHidden = true;

        render(<Marker {...mockProps} />);

        expect(getFormattedPriceSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                pricesHidden: true,
            }),
        );
    });

    it('should render price when prices are hidden and trade-portal is false', () => {
        mockStores.layoutStore.isPricesHidden = true;

        render(<Marker {...mockProps} />);

        expect(getFormattedPriceSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                pricesHidden: false,
            }),
        );
    });

    it('should apply selected class when marker is selected', () => {
        mockProps.selected = true;

        const { container } = render(<Marker {...mockProps} />);

        expect(container.querySelector('.selected')).toBeInTheDocument();
    });
});

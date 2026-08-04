import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ICluster } from 'models/data/map/IMap';

import Cluster, { IClusterProps } from './Cluster';
import * as utils from './ClusteredMarkers.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAdvancedMarkerComponent = jest.fn();
jest.mock('@vis.gl/react-google-maps', () => ({
    __esModule: true,
    AdvancedMarker: ({ children, ...props }) => {
        mockAdvancedMarkerComponent(props);

        return <div data-tid='cluster'>{children}</div>;
    },
}));

jest.mock('frontend/components/icons-new/RoundedPointer', () => ({
    __esModule: true,
    default: () => <div data-tid='rounded-pointer' />,
}));

const getFormattedPriceSpy = jest.spyOn(utils, 'getFormattedPrice');

let mockStores;
let mockProps: IClusterProps;

describe('Cluster', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: {
                isPriceFilterPerPerson: false,
            },
        });

        mockProps = {
            onClick: jest.fn(),
            zIndex: 1,
            item: {
                geometry: {
                    type: 'Point',
                    coordinates: [1.689, 12.678],
                },
                properties: {
                    cluster_id: '1',
                    name: '',
                    price: 1000,
                    pricePP: 500,
                    point_count: 5,
                },
            } as unknown as ICluster,
        };
    });

    it('should render cluster without count when count is not provided', () => {
        mockProps.item['properties']['point_count'] = 0;

        render(<Cluster {...mockProps} />);

        expect(screen.queryByText('5')).not.toBeInTheDocument();
        expect(screen.getByTestId('rounded-pointer')).toBeInTheDocument();
    });

    it('should render cluster without price when prices are hidden and isPricePerPerson is true', () => {
        mockStores.layoutStore.isPricesHidden = true;
        mockStores.layoutStore.isTradePortal = true;
        mockStores.searchFiltersStore.isPriceFilterPerPerson = true;

        render(<Cluster {...mockProps} />);

        expect(screen.queryByText('From')).not.toBeInTheDocument();
        expect(getFormattedPriceSpy).not.toHaveBeenCalled();
    });

    it('should render cluster with pricePP when isPricePerPerson is true', () => {
        mockStores.layoutStore.isSearchResultsPage = true;
        mockStores.searchFiltersStore.isPriceFilterPerPerson = true;

        render(<Cluster {...mockProps} />);

        expect(getFormattedPriceSpy).toHaveBeenCalledWith({
            price: mockProps.item.properties.pricePP,
            formatMoney: expect.any(Function),
            isPricePerPerson: true,
            getPhrase: expect.any(Function),
        });
    });

    it('should render cluster with zIndex when zIndex is provided', () => {
        mockProps.zIndex = 5;

        render(<Cluster {...mockProps} />);

        expect(mockAdvancedMarkerComponent).toHaveBeenCalledWith(expect.objectContaining({ zIndex: 5 }));
    });
});

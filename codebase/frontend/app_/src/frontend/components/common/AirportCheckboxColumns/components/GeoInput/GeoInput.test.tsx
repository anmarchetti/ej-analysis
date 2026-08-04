import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import * as utils from 'frontend/utils/geo.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import GeoInput, { IGeoInputProps } from './GeoInput';

const createStores = () =>
    createMockStores({
        layoutStore: {
            isGeolocationEnabled: true,
            geolocationBounds: [
                [1, 2],
                [3, 4],
            ],
        },
        searchStore: {
            searchFrom: {
                originFromGeo: '',
                onAddOriginFromGeo: jest.fn(),
                setAvailableOrigins: jest.fn(),
                availableOriginsCodes: [1, 2],
            },
        },
    });

const createMockProps = (): IGeoInputProps => ({
    countries: [],
    onAddOrigin: jest.fn(),
    onRemoveOrigin: jest.fn(),
});

let mockStores = createStores();
let mockProps: IGeoInputProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='error-message' />,
}));

jest.mock('frontend/components/icons-new/Geolocation', () => () => <div data-tid='icon' />);

jest.spyOn(utils, 'getGeoPosition').mockResolvedValue({
    coords: {
        latitude: 123,
        longitude: 123,
    },
});

describe('<GeoInput />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createMockProps();
    });

    it('should not render component when geolocation is not enabled', async () => {
        mockStores.layoutStore.isGeolocationEnabled = false;
        let renderContainer;

        await act(async () => {
            const { container } = render(<GeoInput {...mockProps} />);
            renderContainer = container;
        });

        expect(renderContainer).toBeEmptyDOMElement();
    });

    it('should render enabled checkbox', async () => {
        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        expect(screen.getByTestId('geo-input')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).not.toHaveAttribute('disabled');
    });

    it('should render disabled checkbox when no origins codes that are available', async () => {
        mockStores.searchStore.searchFrom.availableOriginsCodes = [];
        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        expect(screen.getByRole('checkbox')).toHaveAttribute('disabled');
    });

    it('should render SearchPodLabelsUseGeolocation label', async () => {
        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        expect(screen.getByText(SitecoreDictionary.GeoInputLabelsUseGeolocation)).toBeInTheDocument();
    });

    it('should render Geolocation icon', async () => {
        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should call getGeoPosition on component mount', async () => {
        const mockGetGeoPosition = jest.spyOn(utils, 'getGeoPosition');
        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        expect(mockGetGeoPosition).toHaveBeenCalled();
    });

    it('should NOT render GeoError when no geolocationBounds', async () => {
        mockStores.layoutStore.geolocationBounds = undefined;
        let renderContainer;

        await act(async () => {
            const { container } = render(<GeoInput {...mockProps} />);
            renderContainer = container;
        });

        expect(renderContainer).toBeEmptyDOMElement();
    });

    it('should render geoError if permission is denied initially', async () => {
        jest.spyOn(utils, 'getGeoPosition').mockRejectedValueOnce({});
        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('should call getClosestAirport when clicking checkbox', async () => {
        const mockGetClosestAirport = jest.spyOn(utils, 'getClosestAirport');
        jest.spyOn(utils, 'isPointInsidePolygon').mockReturnValueOnce(true);
        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        await userEvent.click(screen.getByRole('checkbox'));
        expect(mockGetClosestAirport).toHaveBeenCalled();
    });

    it('should call onAddOriginFromGeo when clicking checkbox from SearchBarDropdown and getClosestAirport returned value', async () => {
        mockProps.isSearchBarDropdown = true;
        jest.spyOn(utils, 'isPointInsidePolygon').mockReturnValueOnce(true);
        jest.spyOn(utils, 'getClosestAirport').mockReturnValue({ code: 'LGT', name: 'LondonGatwick' });

        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        await userEvent.click(screen.getByRole('checkbox'));
        expect(mockStores.searchStore.searchFrom.onAddOriginFromGeo).toHaveBeenCalled();
    });

    it('should call onAddOrigin when clicking checkbox and getClosestAirport returned value', async () => {
        jest.spyOn(utils, 'isPointInsidePolygon').mockReturnValueOnce(true);
        jest.spyOn(utils, 'getClosestAirport').mockReturnValue({ code: 'LGT', name: 'LondonGatwick' });

        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        await userEvent.click(screen.getByRole('checkbox'));
        expect(mockProps.onAddOrigin).toHaveBeenCalled();
    });

    it('should call onRemoveOrigin when clicking checkbox second time', async () => {
        jest.spyOn(utils, 'isPointInsidePolygon').mockReturnValueOnce(true);
        jest.spyOn(utils, 'getClosestAirport').mockReturnValue({ code: 'LGT', name: 'LondonGatwick' });

        await act(async () => {
            render(<GeoInput {...mockProps} />);
        });

        await userEvent.click(screen.getByRole('checkbox'));
        await userEvent.click(screen.getByRole('checkbox'));
        expect(mockProps.onRemoveOrigin).toHaveBeenCalled();
    });
});

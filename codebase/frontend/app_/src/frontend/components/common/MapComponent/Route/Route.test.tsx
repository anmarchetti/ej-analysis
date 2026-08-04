import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IStop } from 'models/data/map/IItinerary';
import * as clusterUtils from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';
import * as hook from 'frontend/components/common/MapComponent/hooks/useRoute';

import Route from './Route';
import { IUseRouteData, IUseRouteProps } from './Route.utils';
import * as utils from './Route.utils';

const setPositionMock = jest.fn();
const setZIndexMock = jest.fn();
const openMock = jest.fn();

const info = {
    setPosition: setPositionMock,
    setZIndex: setZIndexMock,
    open: openMock,
    close: jest.fn(),
};

global.google = {
    maps: {
        InfoWindow: jest.fn(() => info) as unknown as typeof google.maps.InfoWindow,
    },
} as unknown as typeof google;

const data: IUseRouteData = {
    map: {
        getZoom: jest.fn(),
        getProjection: jest.fn(),
    } as unknown as google.maps.Map,
    helper: {
        current: {
            info: { close: jest.fn() },
        },
    } as unknown as IUseRouteData['helper'],
};

jest.spyOn(hook, 'default').mockReturnValue(data);
const getOnStopClickSpy = jest.spyOn(utils, 'getOnStopClick');

const onMouseEnterSpy = jest.spyOn(clusterUtils, 'onMouseEnter').mockImplementation(jest.fn());
const onMouseLeaveSpy = jest.spyOn(clusterUtils, 'onMouseLeave').mockImplementation(jest.fn());

const mockAdvancedMarkerComponent = jest.fn();
jest.mock('@vis.gl/react-google-maps', () => ({
    __esModule: true,
    AdvancedMarker: ({ children, ...props }) => {
        mockAdvancedMarkerComponent(props);

        return (
            <button
                data-tid='marker'
                onClick={props.onClick}
                onMouseEnter={props.onMouseEnter}
                onMouseLeave={props.onMouseLeave}
            >
                {children}
            </button>
        );
    },
}));

let mockProps: IUseRouteProps;

describe('<Route />', () => {
    beforeEach(() => {
        mockProps = {
            route: [
                { id: 'id-1', position: { lat: 11, lng: 22 } },
                { id: 'id-2', position: { lat: 11, lng: 22 } },
            ] as IStop[],
            onChange: jest.fn(),
            setSelected: jest.fn(),
            selectedStop: undefined,
            externallySelectedStop: undefined,
        };
    });

    it('should render when stops are provided', () => {
        render(<Route {...mockProps} />);

        expect(mockAdvancedMarkerComponent).toHaveBeenNthCalledWith(1, {
            onClick: expect.any(Function),
            onMouseEnter: expect.any(Function),
            onMouseLeave: expect.any(Function),
            position: {
                lat: 11,
                lng: 22,
            },
            zIndex: 1,
        });
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getAllByTestId('marker')).toHaveLength(2);
    });

    it('should NOT render when stops are NOT provided', () => {
        mockProps.route = [];

        const { container } = render(<Route {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call getOnStopClick when stop got clicked', () => {
        render(<Route {...mockProps} />);

        screen.getAllByTestId('marker')[0].click();

        expect(data.helper.current.info?.close).toHaveBeenCalled();
        expect(getOnStopClickSpy).toHaveBeenCalledWith({
            map: data.map,
            setSelected: expect.any(Function),
            stop: mockProps.route[0],
        });
    });

    it('should call onMouseEnter when stop got hovered', async () => {
        render(<Route {...mockProps} />);

        await userEvent.hover(screen.getAllByTestId('marker')[0]);

        expect(onMouseEnterSpy).toHaveBeenCalled();
        expect(google.maps.InfoWindow).toHaveBeenCalledWith({
            content: '<p style="margin: 0; padding: 0; color: #FF6600; font-weight: bold;">undefined</p>',
            headerDisabled: true,
        });
        expect(data.helper.current.info).toStrictEqual(info);
        expect(info.setPosition).toHaveBeenCalled();
        expect(info.setZIndex).toHaveBeenCalled();
        expect(info.open).toHaveBeenCalledWith(data.map);
    });

    it('should NOT call onMouseEnter when isSelected is true', async () => {
        mockProps.selectedStop = { id: 'id-1' } as IStop;

        render(<Route {...mockProps} />);

        await userEvent.hover(screen.getAllByTestId('marker')[0]);

        expect(onMouseEnterSpy).not.toHaveBeenCalled();
    });

    it('should call onMouseLeave when stop got unhovered', async () => {
        render(<Route {...mockProps} />);

        await userEvent.unhover(screen.getAllByTestId('marker')[0]);

        expect(onMouseLeaveSpy).toHaveBeenCalled();
    });

    it('should NOT call onMouseLeave when isSelected is true', async () => {
        mockProps.selectedStop = { id: 'id-1' } as IStop;

        render(<Route {...mockProps} />);

        await userEvent.unhover(screen.getAllByTestId('marker')[0]);

        expect(onMouseLeaveSpy).not.toHaveBeenCalled();
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import googleMaps from '@vis.gl/react-google-maps';

import CustomOverlay, { ICustomOverlayProps } from './CustomOverlay';

const map = { name: 'map' };

const spyUseRef = jest.spyOn(React, 'useRef').mockReturnValue({ current: {} });
const spyUseMap = jest.spyOn(googleMaps, 'useMap').mockReturnValue(map as unknown as google.maps.Map);

jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    createPortal: d => d,
}));

let mockProps: ICustomOverlayProps;

describe('<CustomOverlay/>', () => {
    beforeEach(() => {
        mockProps = {
            position: { lat: 10, lng: 20 },
        };
    });

    it('should render children inside the overlay when map is available', () => {
        const mockProjection = {
            fromLatLngToDivPixel: jest.fn().mockReturnValue({ x: 100, y: 200 }),
        };

        const mockOverlayView = {
            onAdd: jest.fn(),
            draw: jest.fn(),
            onRemove: jest.fn(),
            getProjection: jest.fn(() => mockProjection),
            setMap: jest.fn(),
        };

        global.google = {
            maps: {
                OverlayView: jest.fn(() => mockOverlayView) as unknown as typeof google.maps.OverlayView,
                LatLng: jest.fn(),
            } as unknown as typeof google.maps,
        };

        render(
            <CustomOverlay {...mockProps}>
                <div data-tid='overlay-content'>Overlay Content</div>
            </CustomOverlay>,
        );

        expect(mockOverlayView.setMap).toHaveBeenCalledWith(map);
        expect(screen.getByTestId('overlay-content')).toBeInTheDocument();
    });

    it('should NOT render anything when map is unavailable', () => {
        spyUseRef.mockReturnValueOnce({ current: null });
        spyUseMap.mockReturnValueOnce(null);

        const { container } = render(
            <CustomOverlay {...mockProps}>
                <div>Overlay Content</div>
            </CustomOverlay>,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('should clean up the overlay when the component is unmounted', () => {
        const mockOverlayView = {
            onAdd: jest.fn(),
            draw: jest.fn(),
            onRemove: jest.fn(),
            setMap: jest.fn(),
        };

        global.google = {
            maps: {
                OverlayView: jest.fn(() => mockOverlayView) as unknown as typeof google.maps.OverlayView,
            } as unknown as typeof google.maps,
        };

        const { unmount } = render(
            <CustomOverlay {...mockProps}>
                <div>Overlay Content</div>
            </CustomOverlay>,
        );

        unmount();

        expect(mockOverlayView.setMap).toHaveBeenCalledWith(null);
    });
});

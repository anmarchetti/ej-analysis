import reactDom from 'react-dom';
import { render } from '@testing-library/react';
import googleMaps from '@vis.gl/react-google-maps';

import MapControls, { IMapControlsProps } from './MapControls';

const listener = {
    remove: jest.fn(),
};

const map = {
    controls: [
        { push: jest.fn(), removeAt: jest.fn() },
        { push: jest.fn(), removeAt: jest.fn() },
        { push: jest.fn(), removeAt: jest.fn() },
    ],
    addListener: jest.fn().mockReturnValue(listener),
    setZoom: jest.fn(),
    getZoom: jest.fn().mockReturnValue(10),
};

const spyUseMap = jest.spyOn(googleMaps, 'useMap').mockReturnValue(map as unknown as google.maps.Map);

const spyCreatePortal = jest.spyOn(reactDom, 'createPortal');

let mockProps: IMapControlsProps;

describe('<MapControls />', () => {
    beforeEach(() => {
        mockProps = {
            zoomPosition: 1,
            maxZoom: 20,
            minZoom: 4,
            closePosition: undefined,
        };
    });

    it('should render zoom controls in the correct position', () => {
        const { unmount } = render(<MapControls {...mockProps} />);

        expect(map.addListener).toHaveBeenCalledWith('zoom_changed', expect.any(Function));
        expect(map.controls[1].push.mock.calls[0][0]).toContainHTML(
            "<div class='wrapper'><button class='btn plus' data-tid=\"map-zoom-in-button\" /><button class='btn' data-tid=\"map-zoom-out-button\" /></div>",
        );

        expect(spyCreatePortal).toHaveBeenCalledTimes(1);

        unmount();

        expect(listener.remove).toHaveBeenCalledWith();
        expect(map.controls[1].removeAt).toHaveBeenCalledWith(0);
    });

    it('should render close control when closePosition is provided', () => {
        mockProps.closePosition = 1;
        mockProps.zoomPosition = 2;

        const { unmount } = render(<MapControls {...mockProps} />);

        expect(map.controls[1].push.mock.calls[0][0]).toContainHTML(
            "<div class='wrapper'><button class='btn close plus' data-tid=\"map-close-button\" /></div>",
        );

        expect(spyCreatePortal).toHaveBeenCalledTimes(2);

        unmount();

        expect(map.controls[1].removeAt).toHaveBeenCalledWith(0);
    });

    it('should render close control and zoom control when both is provided', () => {
        mockProps.closePosition = 1;
        mockProps.zoomPosition = 2;

        const { unmount } = render(<MapControls {...mockProps} />);

        expect(map.controls[2].push.mock.calls[0][0]).toContainHTML(
            "<div class='wrapper'><button class='btn plus' data-tid=\"map-zoom-in-button\" /><button class='btn' data-tid=\"map-zoom-out-button\" /></div>",
        );

        expect(map.controls[1].push.mock.calls[0][0]).toContainHTML(
            "<div class='wrapper'><button class='btn close plus' data-tid=\"map-close-button\" /></div>",
        );

        expect(spyCreatePortal).toHaveBeenCalledTimes(2);

        unmount();

        expect(map.controls[2].removeAt).toHaveBeenCalledWith(0);
        expect(map.controls[1].removeAt).toHaveBeenCalledWith(0);
    });

    it('should NOT render anything when map is unavailable', () => {
        spyUseMap.mockReturnValueOnce(null);

        const { container } = render(<MapControls {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});

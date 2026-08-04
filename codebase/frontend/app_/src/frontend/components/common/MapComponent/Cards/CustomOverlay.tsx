import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from '@vis.gl/react-google-maps';

import { IGeoPosition } from 'models/data/map/IMap';

export interface ICustomOverlayProps {
    position: IGeoPosition;
    children?: React.ReactNode;
}

const contextMenuHandler = (e): boolean => (e.cancelBubble = true);

// marker height + 12px padding
const MARKER_HEIGHT = 34;

const CustomOverlay: FC<ICustomOverlayProps> = ({ position, children }) => {
    const map = useMap();
    const [container, setContainer] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!map) return;

        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.transform = 'translate(-50%, -100%)';

        setContainer(el);

        const overlay = new google.maps.OverlayView();

        overlay.onAdd = (): void => {
            overlay.getPanes()?.floatPane.appendChild(el);

            // allow context-menu on right click
            el.addEventListener('contextmenu', contextMenuHandler);
        };

        overlay.draw = (): void => {
            const projection = overlay.getProjection();

            if (!projection || !el) return;

            const pos = projection.fromLatLngToDivPixel(position);

            if (pos) {
                el.style.left = pos.x + 'px';
                el.style.top = pos.y - MARKER_HEIGHT + 'px';
            }
        };

        overlay.onRemove = (): void => {
            el.removeEventListener('contextmenu', contextMenuHandler);
            el.remove();
        };

        overlay.setMap(map);

        return (): void => overlay.setMap(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position.lat, position.lng]);

    return container ? createPortal(children, container) : null;
};

export default CustomOverlay;

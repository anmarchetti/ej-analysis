import { useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { BBox } from 'geojson';

export interface IUseMapViewportData {
    bbox: BBox;
    zoom: number | undefined;
}

const D_180 = 180;
const D_90 = 90;

// [minLng, minLat, maxLng, maxLat]
export const DEFAULT_BBOX: BBox = [-D_180, -D_90, D_180, D_90];

const useMapViewport = (): IUseMapViewportData => {
    const map = useMap();

    const [bbox, setBbox] = useState<BBox>(DEFAULT_BBOX);
    const [zoom, setZoom] = useState(map?.getZoom?.());

    // observe the map to get current bounds
    useEffect(() => {
        if (!map) return;

        const listener = map.addListener('idle', () => {
            const bounds = map.getBounds();
            const zoom = map.getZoom();
            const projection = map.getProjection();

            if (!bounds || !zoom || !projection) return;

            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();

            const bbox: BBox = [
                Math.max(-D_180, sw.lng()),
                Math.max(-D_90, sw.lat()),
                Math.min(D_180, ne.lng()),
                Math.min(D_90, ne.lat()),
            ];

            setBbox(bbox);
            setZoom(zoom);
        });

        return (): void => listener.remove();
    }, [map]);

    return { bbox, zoom };
};

export default useMapViewport;

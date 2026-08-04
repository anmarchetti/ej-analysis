import { FC, memo } from 'react';
import { APIProvider, ControlPosition, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import classNames from 'classnames';
import equal from 'fast-deep-equal';

import { envPublic } from 'code/env';
import { IGeoPosition } from 'models/data/map/IMap';

import MapControls from './MapControls/MapControls';
import { equalRoute } from './Route/Route.utils';
import MapContent, { IMapContentProps } from './MapContent';

import styles from './MapComponent.module.scss';

const API_KEY = envPublic.GOOGLE_MAPS_API_KEY;
const MAP_ID = '__googleMapsEasyJetHolidays';

export const arePropsEqual = (prevProps: IMapComponentProps, nextProps: IMapComponentProps): boolean => {
    const { hotel, selectedStop, route, hotels, zoomControlPosition } = prevProps;

    return (
        zoomControlPosition === nextProps.zoomControlPosition &&
        hotel?.properties?.id === nextProps.hotel?.properties?.id &&
        selectedStop?.id === nextProps.selectedStop?.id &&
        equalRoute(route, nextProps.route) &&
        equal(hotels, nextProps.hotels)
    );
};

export interface IMapComponentProps extends IMapContentProps {
    center?: IGeoPosition;
    className?: string;
    clickableIcons?: boolean;
    closeControlPosition?: ControlPosition;
    defaultZoom?: number;
    gestureHandling?: string;
    maxZoom?: number;
    minZoom?: number;
    onCameraChanged?: (event: MapCameraChangedEvent) => void;
    zoomControlPosition?: ControlPosition;
}

const DEFAULT_ZOOM = 4;
const DEFAULT_MIN_ZOOM = 4;
const DEFAULT_MAX_ZOOM = 20;

const MapComponent: FC<IMapComponentProps> = ({
    className,
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    defaultZoom = DEFAULT_ZOOM,
    center,
    clickableIcons = false,
    zoomControlPosition = ControlPosition.TOP_RIGHT,
    closeControlPosition,
    onCameraChanged,
    gestureHandling = 'cooperative',
    ...props
}) => (
    <div className={classNames(styles.mapWrapper, className)} data-tid='map-wrapper'>
        <APIProvider apiKey={API_KEY}>
            <Map
                className={styles.map}
                mapId={MAP_ID}
                defaultZoom={defaultZoom}
                minZoom={minZoom}
                maxZoom={Math.min(maxZoom, DEFAULT_MAX_ZOOM)}
                // while the center is null, the map is not rendered
                defaultCenter={(center ?? null) as IGeoPosition}
                onCameraChanged={onCameraChanged}
                scaleControl
                disableDefaultUI
                gestureHandling={gestureHandling}
                clickableIcons={clickableIcons}
            >
                <MapContent autoFit={!center} {...props} />

                <MapControls
                    zoomPosition={zoomControlPosition}
                    closePosition={closeControlPosition}
                    minZoom={minZoom}
                    maxZoom={Math.min(maxZoom, DEFAULT_MAX_ZOOM)}
                />
            </Map>
        </APIProvider>
    </div>
);

export default memo(MapComponent, arePropsEqual);

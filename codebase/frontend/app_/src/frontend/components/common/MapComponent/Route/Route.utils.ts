import { MutableRefObject } from 'react';

import { IStop, TOnRouteChange, TRouteHelperBasic } from 'models/data/map/IItinerary';
import { TSetSelectedMapCardData } from 'models/data/map/IMap';
import {
    getOffsetLatLng,
    panToWithOffset,
} from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';

export interface IUseRouteData {
    helper: MutableRefObject<TRouteHelperBasic>;
    map: google.maps.Map;
}

export interface IUseRouteProps {
    onChange: TOnRouteChange;
    route: IStop[];
    setSelected: TSetSelectedMapCardData;
    externallySelectedStop?: IStop;
    selectedStop?: IStop;
}

export const equalRoute = (route?: IStop[], nextRoute?: IStop[]): boolean => {
    if (route === nextRoute) return true;

    if (nextRoute?.length !== route?.length) return false;

    return nextRoute?.[0]?.id === route?.[0]?.id && nextRoute?.at(-1)?.id === route?.at(-1)?.id;
};

export const fetchRoute = async ({
    stops,
    service = new google.maps.DirectionsService(),
}: {
    stops: IStop[];
    service?: google.maps.DirectionsService;
}): Promise<(google.maps.DirectionsRoute | null)[]> => {
    const promises: Promise<google.maps.DirectionsRoute | null>[] = [];

    for (let i = 0; i < stops.length - 1; i++) {
        const origin = stops[i].position;
        const destination = stops[i + 1].position;

        const { WALKING, TRANSIT } = google.maps.TravelMode;
        const travelMode = stops[i].travelMode.toUpperCase() === WALKING ? WALKING : TRANSIT;

        promises.push(
            new Promise<google.maps.DirectionsRoute | null>(res =>
                service.route(
                    {
                        origin,
                        destination,
                        travelMode,
                    },
                    (result, status) => {
                        if (status === 'OK' && result?.routes[0]) {
                            res(result.routes[0]);
                        } else {
                            console.error('Directions failed:', status);
                            res(null);
                        }
                    },
                ),
            ),
        );
    }

    return Promise.all(promises);
};

const STOP_OFFSET_Y = -150;

export const getOnStopClick = ({
    setSelected,
    stop,
    map,
}: {
    map: google.maps.Map;
    setSelected: TSetSelectedMapCardData;
    stop: IStop;
}) => {
    panToWithOffset(map, stop.position, 0, STOP_OFFSET_Y);

    setSelected({
        hotel: undefined,
        stop,
    });
};

const INFO_WINDOW_OFFSET_Y = -30;

export const createInfoWindow = ({ map, stop }: { map: google.maps.Map; stop: IStop }): google.maps.InfoWindow => {
    const info = new google.maps.InfoWindow({
        content: `<p style="margin: 0; padding: 0; color: #FF6600; font-weight: bold;">${stop.name}</p>`,
        headerDisabled: true,
    });

    info.setPosition(getOffsetLatLng(map, stop.position, 0, INFO_WINDOW_OFFSET_Y));
    info.setZIndex(1);
    info.open(map);

    return info;
};

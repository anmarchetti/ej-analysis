import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

import { IStop, TRouteHelper } from 'models/data/map/IItinerary';
import { fitBounds } from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';
import {
    equalRoute,
    fetchRoute,
    getOnStopClick,
    IUseRouteData,
    IUseRouteProps,
} from 'frontend/components/common/MapComponent/Route/Route.utils';

const POLYLINE_STYLING = {
    strokeOpacity: 0,
    icons: [
        {
            icon: {
                path: 'M 0, 0 m -2, 0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0',
                strokeOpacity: 1,
                fillColor: '#ff4600',
                fillOpacity: 1,
                strokeColor: '#ff4600',
                scale: 1.7,
            },
            offset: '0',
            repeat: '18px',
        },
    ],
};

const useRoute = ({ route: stops, externallySelectedStop, onChange, setSelected }: IUseRouteProps): IUseRouteData => {
    const map = useMap();
    const helper = useRef<TRouteHelper>({ polyline: null, stops: [], info: null });

    // fetch route data to draw polyline
    useEffect(() => {
        if (!map || equalRoute(helper.current.stops, stops)) return;

        helper.current.stops = stops;

        fitBounds({ map, list: stops });

        fetchRoute({ stops, service: new google.maps.DirectionsService() }).then(data => {
            const routes = data.filter(Boolean) as google.maps.DirectionsRoute[];

            if (!routes.length) return;

            // add duration to DestinationContent component
            onChange(routes.map(r => ({ route: r.legs[0] })));

            // get paths from all routes
            const paths = routes.map(r => r.overview_path);

            if (paths.length) {
                //remove previous polyline if exists
                helper.current.polyline?.setMap(null);
                // draw new polyline
                helper.current.polyline = new google.maps.Polyline({
                    map,
                    path: paths.flat(),
                    ...POLYLINE_STYLING,
                });
            }
        });

        // close map card when route change
        setSelected(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, stops]);

    // if stop is selected outside the map, simulate select it
    useEffect(() => {
        if (!map || !externallySelectedStop) return;

        const { id } = externallySelectedStop;

        getOnStopClick({ map, setSelected, stop: stops.find(s => s.id === id) as IStop });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externallySelectedStop]);

    return {
        map: map as google.maps.Map,
        helper,
    };
};

export default useRoute;

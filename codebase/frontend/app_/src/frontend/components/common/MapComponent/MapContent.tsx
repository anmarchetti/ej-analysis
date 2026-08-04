import { FC, useEffect, useRef, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

import useStore from 'frontend/hooks/useStore';
import { IOfferWithHotelData } from 'models/data/IOffer';
import { IStop, TOnRouteChange } from 'models/data/map/IItinerary';
import { IGeoPoint, TRestoreState, TSelectedMapCardData } from 'models/data/map/IMap';

import CustomOverlay from './Cards/CustomOverlay';
import MapCard from './Cards/MapCard';
import ClusteredMarkers from './Clusters/ClusteredMarkers';
import { getOverlayPosition } from './Clusters/ClusteredMarkers.utils';
import Route from './Route/Route';

export interface IMapContentProps {
    hotels: IGeoPoint[];
    autoFit?: boolean;
    hotel?: IGeoPoint;
    onRouteChange?: TOnRouteChange;
    onSaveState?: (zoomLevel: number, selected: TSelectedMapCardData) => void;
    onUnmount?: () => void;
    restoreState?: TRestoreState;
    route?: IStop[];
    selectedStop?: IStop;
}

const MapContent: FC<IMapContentProps> = ({
    hotel,
    hotels,
    autoFit,
    route,
    selectedStop: externallySelectedStop,
    onRouteChange,
    onSaveState,
    onUnmount,
    restoreState,
}) => {
    const cachedHotelData = useRef<Map<string, IOfferWithHotelData>>(new Map());
    const [selected, setSelected] = useState<TSelectedMapCardData>(null);
    const map = useMap();

    const { pathname } = useStore(stores => ({
        pathname: stores.routerStore.pathname,
    }));

    // Eagerly write map state to the URL whenever the selected card changes.
    useEffect(() => {
        if (!onSaveState) return;

        const zoom = map?.getZoom();

        if (zoom != null) {
            onSaveState(zoom, selected);
        }
        // map is a stable instance — safe to omit from deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    useEffect(
        () => () => {
            // since different maps have different data-handling logic,
            // in some cases we need to clear the data and
            // close the map on URL changes
            onUnmount?.();
            // we also clear the cached hotel data
            cachedHotelData.current.clear();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [pathname],
    );

    const anyStops = !!route?.length;

    return (
        <>
            <ClusteredMarkers
                autoFit={autoFit && !route}
                item={hotel}
                items={hotels}
                selected={selected}
                setSelected={setSelected}
                cache={cachedHotelData.current}
                restoreState={restoreState}
            />

            {anyStops && (
                <Route
                    route={route}
                    externallySelectedStop={externallySelectedStop}
                    selectedStop={selected?.stop}
                    onChange={onRouteChange!}
                    setSelected={setSelected}
                />
            )}

            {selected && (
                <CustomOverlay position={getOverlayPosition(selected)}>
                    <MapCard
                        hotel={selected.hotel}
                        stop={selected.stop}
                        setSelected={setSelected}
                        cache={cachedHotelData.current}
                    />
                </CustomOverlay>
            )}
        </>
    );
};

export default MapContent;

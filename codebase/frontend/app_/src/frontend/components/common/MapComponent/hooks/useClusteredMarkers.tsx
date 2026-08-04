import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import Supercluster from 'supercluster';

import { TWO } from 'code/commonNumbers';
import useStore from 'frontend/hooks/useStore';
import { BaseTrackingStore } from 'frontend/store/base/tracking/BaseTrackingStore';
import { IOfferWithHotelData } from 'models/data/IOffer';
import {
    ICluster,
    IGeoPoint,
    TRestoreState,
    TSelectedMapCardData,
    TSetSelectedMapCardData,
} from 'models/data/map/IMap';
import {
    centerMapCardVertically,
    fitBounds,
    getMarkerOnClick,
} from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';

import { DEFAULT_BBOX } from './useMapViewport';
import useSupercluster, { SUPERCLUSTER_OPTIONS } from './useSupercluster';

export interface IUseClusteredMarkersProps {
    items: IGeoPoint[];
    selected: TSelectedMapCardData;
    setSelected: TSetSelectedMapCardData;
    autoFit?: boolean;
    cache?: Map<string, IOfferWithHotelData>;
    item?: IGeoPoint;
    restoreState?: TRestoreState;
}

export interface IUseClusteredMarkersData {
    clusterer: Supercluster;
    clusters: (IGeoPoint | ICluster)[];
    getMarkerOnClick: typeof getMarkerOnClick;
    map: google.maps.Map;
    trackMapEvent: BaseTrackingStore['trackMapEvent'];
    zIndexMap: Map<string | number, number>;
}

const useClusteredMarkers = ({
    items,
    autoFit,
    setSelected,
    cache,
    restoreState,
}: IUseClusteredMarkersProps): IUseClusteredMarkersData => {
    const map = useMap() as google.maps.Map;

    const { trackMapEvent } = useStore(stores => ({
        trackMapEvent: stores.trackingStore.trackMapEvent,
    }));

    const { clusters, clusterer, zIndexMap, version } = useSupercluster({ items });

    useEffect(() => {
        if (!autoFit || version === 0) return;

        // if data (filter) changed then reset cache
        cache?.clear();

        setSelected(null);

        if (!items.length) return;

        // if there's saved map state, use it to position the map
        const saved = restoreState?.();

        const savedHotelCoordinates = saved?.selected?.hotel?.geometry?.coordinates;

        if (saved && savedHotelCoordinates?.length === TWO) {
            map.setZoom(saved.zoomLevel);

            centerMapCardVertically(map, savedHotelCoordinates);

            setSelected(saved.selected);

            return;
        }

        /* The further we zoom in to fetch the clusters, the better fitting the initial viewport will be.
         * fitBounds handles the zoom level and center of the map, as long as it's provided an accurate list of clusters.
         * Use the max zoom level at which clusters are generated from the SUPERCLUSTER_OPTIONS.
         * Lower values can result in slightly better performance in some cases, but it is only a matter of milliseconds
         * for the most densely populated maps on the slowest devices. See the write up here:
         * https://easyjet.atlassian.net/browse/INS-1810?focusedCommentId=787825
         */
        const clustersList = clusterer.getClusters(DEFAULT_BBOX, SUPERCLUSTER_OPTIONS.maxZoom as number) as (
            | IGeoPoint
            | ICluster
        )[];

        fitBounds({
            map,
            list: clustersList,
            // Padding level of 20 seems to provide a good fit for the clusters in the viewport, without cutting off any markers on the edges,
            // while still keeping the zoom level as high as possible
            padding: 20,
        });
        // version is the cheapest way to catch data changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version]);

    return {
        clusters,
        clusterer,
        getMarkerOnClick,
        map,
        zIndexMap,
        trackMapEvent,
    };
};

export default useClusteredMarkers;

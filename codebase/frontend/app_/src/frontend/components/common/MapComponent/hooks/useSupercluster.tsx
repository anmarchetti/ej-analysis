import { useEffect, useMemo, useReducer } from 'react';
import Supercluster from 'supercluster';

import { ICluster, IGeoPoint } from 'models/data/map/IMap';
import { isValidGeoPoint } from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';

import useMapViewport from './useMapViewport';

export interface IUseClusterData {
    clusterer: Supercluster;
    clusters: (ICluster | IGeoPoint)[];
    version: number;
    zIndexMap: Map<string | number, number>;
}

type TSuperclusterOptions = Supercluster.Options<IGeoPoint['properties'], ICluster['properties']>;

export const SUPERCLUSTER_OPTIONS: TSuperclusterOptions = {
    extent: 256,
    radius: 60,
    maxZoom: 18,
    minZoom: 1,
    minPoints: 2,
    map: props => ({ price: props.price, pricePP: props.pricePP } as ICluster['properties']),
    reduce: (clusterProps, itemProps): void => {
        if (!itemProps.price && !itemProps.pricePP) return;

        clusterProps.price = Math.min(itemProps.price!, clusterProps.price!);
        clusterProps.pricePP = Math.min(itemProps.pricePP!, clusterProps.pricePP!);
    },
};

export const useSupercluster = (
    { items }: { items: IGeoPoint[] },
    superclusterOptions: TSuperclusterOptions = SUPERCLUSTER_OPTIONS,
): IUseClusterData => {
    // create the clusterer and keep it
    const clusterer = useMemo(() => new Supercluster(superclusterOptions), [superclusterOptions]);

    // version-number for the data loaded into the clusterer
    // (this is needed to trigger updating the clusters when data was changed)
    const [version, dataWasUpdated] = useReducer((x: number) => x + 1, 0);

    // when data changes, load it into the clusterer
    useEffect(() => {
        clusterer.load(items.filter(isValidGeoPoint));
        dataWasUpdated();
    }, [clusterer, items]);

    // get bounding-box and zoom-level from the map
    const { bbox, zoom } = useMapViewport();

    // retrieve the clusters within the current viewport
    const { clusters, zIndexMap } = useMemo(() => {
        // since MobX tracks changes in the data array,
        // we create a separate helper to manage the zIndex
        const zIndexMap = new Map<string, number>();

        // don't try to read clusters before data was loaded into the clusterer (version===0),
        // otherwise getClusters will crash
        if (version === 0 || !zoom) return { clusters: [], zIndexMap };

        const cls = clusterer
            .getClusters(bbox, zoom)
            .sort((a, b) => b.geometry.coordinates[1] - a.geometry.coordinates[1]);

        for (let i = 0; i < cls.length; i++) {
            const id = cls[i].id || cls[i].properties['id'];
            zIndexMap.set(id, i);
        }

        return {
            clusters: cls,
            zIndexMap,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version, bbox, zoom]);

    return {
        clusters,
        clusterer,
        zIndexMap,
        version,
    };
};

export default useSupercluster;

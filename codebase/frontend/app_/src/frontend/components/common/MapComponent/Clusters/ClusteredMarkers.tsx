import { ICluster, IGeoPoint } from 'models/data/map/IMap';
import useClusteredMarkers, {
    IUseClusteredMarkersProps,
} from 'frontend/components/common/MapComponent/hooks/useClusteredMarkers';

import Cluster from './Cluster';
import { getLatLng, SELECTED_Z_INDEX } from './ClusteredMarkers.utils';
import Marker from './Marker';

const ClusteredMarkers: React.FC<IUseClusteredMarkersProps> = props => {
    const { item: mainItem, selected, setSelected, items } = props;

    const { map, clusters, getMarkerOnClick, clusterer, zIndexMap, trackMapEvent } = useClusteredMarkers(props);

    if (!mainItem && !items.length) return null;

    return (
        <>
            {mainItem && (
                <Marker
                    zIndex={SELECTED_Z_INDEX}
                    item={mainItem}
                    selected={mainItem.properties.id === selected?.hotel?.properties.id}
                    onClick={getMarkerOnClick({ map, setSelected, item: mainItem, trackMapEvent })}
                />
            )}

            {clusters.map(cluster => {
                const clusterId: number | undefined = cluster.properties['cluster_id'];

                if (clusterId) {
                    // don't change to cluster.id, can cause re-render
                    const key = cluster.geometry.coordinates.join('-');

                    return (
                        <Cluster
                            key={key}
                            zIndex={zIndexMap.get(clusterId)!}
                            item={cluster as ICluster}
                            onClick={(): void => {
                                setSelected(null);

                                map.panTo(getLatLng(cluster.geometry.coordinates));
                                map.setZoom(clusterer.getClusterExpansionZoom(clusterId));
                            }}
                        />
                    );
                }

                const item = cluster as IGeoPoint;
                const markerId = item.properties.id;

                return (
                    <Marker
                        key={markerId}
                        zIndex={zIndexMap.get(markerId)!}
                        item={item}
                        selected={markerId === selected?.hotel?.properties.id}
                        onClick={getMarkerOnClick({ item, map, setSelected, trackMapEvent })}
                    />
                );
            })}
        </>
    );
};

export default ClusteredMarkers;

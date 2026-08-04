import { AdvancedMarker } from '@vis.gl/react-google-maps';

import { onMouseEnter, onMouseLeave } from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';
import useRoute from 'frontend/components/common/MapComponent/hooks/useRoute';

import { createInfoWindow, getOnStopClick, IUseRouteProps } from './Route.utils';

import styles from './Route.module.scss';

const Route: React.FC<IUseRouteProps> = props => {
    const { helper, map } = useRoute(props);

    const { route: stops, selectedStop, setSelected } = props;

    return (
        <>
            {stops.map((stop, idx) => {
                const isSelected = selectedStop?.id === stop.id;

                return (
                    <AdvancedMarker
                        key={stop.id}
                        position={stop.position}
                        zIndex={++idx}
                        onClick={(): void => {
                            helper.current.info?.close();

                            getOnStopClick({ map, stop, setSelected });
                        }}
                        onMouseEnter={(e): void => {
                            if (isSelected) return;

                            onMouseEnter(e);

                            helper.current.info = createInfoWindow({ map, stop });
                        }}
                        onMouseLeave={(e): void => {
                            if (isSelected) return;

                            onMouseLeave(e);

                            helper.current.info?.close();
                        }}
                    >
                        <div id={stop.id} className={styles.wrapper}>
                            {idx}
                        </div>
                    </AdvancedMarker>
                );
            })}
        </>
    );
};

export default Route;

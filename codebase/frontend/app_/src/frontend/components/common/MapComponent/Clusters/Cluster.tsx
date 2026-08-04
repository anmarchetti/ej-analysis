import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { ICluster } from 'models/data/map/IMap';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import IconBed from 'frontend/components/icons/Bed';
import RoundedPointer from 'frontend/components/icons-new/RoundedPointer';

import { getFormattedPrice, getLatLng, onMouseEnter, onMouseLeave } from './ClusteredMarkers.utils';

import styles from './Cluster.module.scss';

export interface IClusterProps {
    item: ICluster;
    onClick: () => void;
    zIndex: number;
}

const Cluster: React.FC<IClusterProps> = props => {
    const { onClick, zIndex, item } = props;

    const { getPhrase, formatMoney, isPricePerPerson, pricesHidden } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        pricesHidden: isTradeStore(stores) && stores.layoutStore.isPricesHidden,
        isPricePerPerson:
            // available only on sr-page
            stores.layoutStore.isSearchResultsPage && stores.searchFiltersStore.isPriceFilterPerPerson,
    }));

    const { point_count: count, price, pricePP } = item.properties;

    const anyPrice = isPricePerPerson ? pricePP : price;

    return (
        <AdvancedMarker
            position={getLatLng(item.geometry.coordinates)}
            onClick={onClick}
            zIndex={zIndex}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className={styles.clusterWrapper} data-z-index={zIndex} data-tid='cluster-wrapper'>
                {!!anyPrice && !pricesHidden && (
                    <div className={styles.extra} data-tid='cluster-extra'>
                        <div>{getPhrase(SitecoreDictionary.GlobalsLabelsFrom).toLowerCase()}</div>
                        {getFormattedPrice({ price: anyPrice, formatMoney, isPricePerPerson, getPhrase })}
                    </div>
                )}
                <div className={styles.pin} data-tid='cluster-pin'>
                    <span className={styles.text}>{count}</span>
                    <IconBed />
                    <RoundedPointer className={styles.pointer} />
                </div>
            </div>
        </AdvancedMarker>
    );
};

export default observer(Cluster);

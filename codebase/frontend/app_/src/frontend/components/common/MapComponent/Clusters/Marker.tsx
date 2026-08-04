import { AdvancedMarker } from '@vis.gl/react-google-maps';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { IGeoPoint } from 'models/data/map/IMap';
import IconBed from 'frontend/components/icons/Bed';
import RoundedPointer from 'frontend/components/icons-new/RoundedPointer';

import { getFormattedPrice, getLatLng, onMouseEnter, onMouseLeave, SELECTED_Z_INDEX } from './ClusteredMarkers.utils';

import styles from './Marker.module.scss';

export interface IMarkerProps {
    item: IGeoPoint;
    onClick: () => void;
    zIndex: number;
    selected?: boolean;
}
const Marker: React.FC<IMarkerProps> = props => {
    const { getPhrase, formatMoney, pricesHidden, isPricePerPerson } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        pricesHidden: isTradeStore(stores) && stores.layoutStore.isPricesHidden,
        isPricePerPerson:
            // available only on sr-page
            stores.layoutStore.isSearchResultsPage && stores.searchFiltersStore.isPriceFilterPerPerson,
    }));

    const { onClick, zIndex: initialZIndex, selected, item } = props;

    const { price: totalPrice, pricePP, name } = item.properties;
    const price = isPricePerPerson ? pricePP : totalPrice;

    const text =
        price && !name ? getFormattedPrice({ price, formatMoney, isPricePerPerson, getPhrase, pricesHidden }) : '';

    const zIndex = selected ? SELECTED_Z_INDEX : initialZIndex;

    return (
        <AdvancedMarker
            position={getLatLng(item.geometry.coordinates)}
            onClick={onClick}
            zIndex={zIndex}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div
                className={classNames(styles.markerWrapper, { [styles.selected]: selected })}
                data-z-index={zIndex}
                data-tid='marker-wrapper'
            >
                {name && !selected && (
                    <div className={styles.extra} data-tid='marker-extra'>
                        {name}
                    </div>
                )}
                <div className={styles.pin} data-tid='marker-pin'>
                    {text ? (
                        <span className={styles.text} data-tid='marker-text'>
                            {text}
                        </span>
                    ) : (
                        <IconBed />
                    )}
                    <RoundedPointer className={styles.pointer} />
                </div>
            </div>
        </AdvancedMarker>
    );
};

export default observer(Marker);

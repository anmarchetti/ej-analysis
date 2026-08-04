import * as React from 'react';
import { ControlPosition } from '@vis.gl/react-google-maps';
import classNames from 'classnames';
import { action, computed, makeObservable } from 'mobx';
import { inject } from 'mobx-react';

import BaseOffersStore from 'frontend/store/base/offers/BaseOffersStore';
import { TStores } from 'frontend/store/IStores';
import { IOfferWithHotelData } from 'models/data/IOffer';
import { IGeoPoint, IGeoPosition, IMapParams } from 'models/data/map/IMap';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { getLatLng, removeDuplicates } from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';
import MapComponent from 'frontend/components/common/MapComponent/MapComponent';

import styles from './HotelLocation.module.scss';

export interface IHotelLocationBookingProps extends ISitecoreComponent<null, IMapParams> {
    hotels: IGeoPoint[];
    isScreenExtraSmall: boolean;
    isShown: boolean;
    onCameraChanged: BaseOffersStore['onCameraChanged'];
    onUnmount: () => void;
    selectedOffer: Nullable<IOfferWithHotelData>;
}

const DEFAULT_ZOOM = 16;
const DEFAULT_MIN_ZOOM = 15;
const DEFAULT_MAX_ZOOM = 20;

export class HotelLocationBooking extends React.Component<IHotelLocationBookingProps> {
    constructor(props: IHotelLocationBookingProps) {
        super(props);
        makeObservable(this);
    }

    @computed private get params(): {
        defaultZoom: number;
        maxZoom: number;
        minZoom: number;
        center?: IGeoPosition;
        closeControlPosition?: ControlPosition;
        gestureHandling?: string;
        zoomControlPosition?: ControlPosition;
    } {
        const { params, isScreenExtraSmall } = this.props;
        const { MinZoom = DEFAULT_MIN_ZOOM, InitialZoom = DEFAULT_ZOOM, MaxZoom = DEFAULT_MAX_ZOOM } = params;

        return {
            minZoom: +MinZoom,
            defaultZoom: +InitialZoom,
            maxZoom: +MaxZoom,
            center: getLatLng(this.hotel.geometry.coordinates),
            zoomControlPosition: isScreenExtraSmall ? ControlPosition.RIGHT_BOTTOM : undefined,
            closeControlPosition: isScreenExtraSmall ? ControlPosition.TOP_RIGHT : undefined,
            gestureHandling: isScreenExtraSmall ? 'greedy' : undefined,
        };
    }

    @computed get hotel(): IGeoPoint {
        const { hotel, price, pricePP, accom: { id = '' } = {} } = this.props.selectedOffer ?? {};
        const { name, longitude: lng = 0, latitude: lat = 0 } = hotel ?? {};

        return {
            geometry: {
                type: 'Point',
                coordinates: [+lng, +lat],
            },
            properties: {
                name,
                id,
                price,
                pricePP,
            },
            type: 'Feature',
        };
    }

    @computed get hotels(): IGeoPoint[] {
        const coords = this.hotel?.geometry.coordinates.join();

        return removeDuplicates(this.props.hotels, coords);
    }

    @action onUnmount = (): void => {
        this.props.onUnmount();
    };

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    render(): JSX.Element | null {
        if (!this.props.isShown) return null;

        return (
            <MapComponent
                {...this.params}
                className={classNames(styles.map, styles.priority)}
                hotel={this.hotel}
                hotels={this.hotels}
                onUnmount={this.onUnmount}
                onCameraChanged={this.props.onCameraChanged}
            />
        );
    }
}

const ConnectedHotelLocationBooking = inject((stores: TStores) => ({
    selectedOffer: stores.bookingStore.selectedOffer,
    onCameraChanged: stores.hotelsStore.onCameraChanged,
    hotels: stores.hotelsStore.hotels || [],
    isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
    isShown:
        (stores.appStore.isScreenExtraSmall && stores.bookingStore.isShownMapOnMobile) ||
        stores.bookingStore.isShownMapOnDesktop,
    onUnmount: (): void => {
        stores.hotelsStore.cleanUpHotels();
        stores.bookingStore.toggleMapVisibilityOnMobile(false);
        stores.bookingStore.toggleMapVisibilityOnDesktop(false);
    },
}))(HotelLocationBooking);

export default ConnectedHotelLocationBooking;

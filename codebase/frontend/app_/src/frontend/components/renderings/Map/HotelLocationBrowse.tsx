import * as React from 'react';
import { ControlPosition } from '@vis.gl/react-google-maps';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { HotelsService } from 'frontend/services/hotels.service';
import { TStores } from 'frontend/store/IStores';
import { IHotelInfoFields } from 'models/data/IHotelInfoFields';
import { IGeoPoint, IGeoPosition, IMapParams } from 'models/data/map/IMap';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { getLatLng, removeDuplicates } from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';
import MapComponent from 'frontend/components/common/MapComponent/MapComponent';

import styles from './HotelLocation.module.scss';

export interface IHotelLocationBrowseProps extends ISitecoreComponent<null, IMapParams> {
    accommodationOrDestinationCode: string;
    close: () => void;
    isScreenExtraSmall: boolean;
    isShown: boolean;
    pageFields: IHotelInfoFields;
}

const DEFAULT_ZOOM = 16;
const DEFAULT_MIN_ZOOM = 15;
const DEFAULT_MAX_ZOOM = 20;

export class HotelLocationBrowse extends React.Component<IHotelLocationBrowseProps> {
    @observable private hotels: IGeoPoint[] = [];

    constructor(props: IHotelLocationBrowseProps) {
        super(props);
        makeObservable(this);
    }

    @action onCameraChanged = debounce(async ({ detail }): Promise<void> => {
        try {
            const { features = [] } = await HotelsService.fetchPolygonHotels({
                lt1: detail.bounds.north, // max lat
                ln1: detail.bounds.east, // max lng
                lt2: detail.bounds.south, // min lat
                ln2: detail.bounds.west, // min lng
            });

            const coords = this.hotel?.geometry.coordinates.join();

            this.hotels = removeDuplicates(features, coords);
        } catch {}
    }, 500);

    @action onUnmount = (): void => {
        this.hotels = [];
        this.props.close();
    };

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

    @computed private get hotel(): IGeoPoint {
        const { pageFields = {}, accommodationOrDestinationCode } = this.props;
        const {
            Code: { value: id = '' } = {},
            Name: { value: name } = {},
            Latitude: { value: lat = 0 } = {},
            Longitude: { value: lng = 0 } = {},
        } = pageFields as IHotelInfoFields;

        return {
            geometry: {
                type: 'Point',
                coordinates: [+lng, +lat],
            },
            properties: {
                name,
                id: accommodationOrDestinationCode || id,
                price: undefined,
                pricePP: undefined,
            },
            type: 'Feature',
        };
    }

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
                onCameraChanged={this.onCameraChanged}
            />
        );
    }
}

const ConnectedHotelLocationBrowse = inject((stores: TStores) => ({
    pageFields: stores.layoutStore.pageFields,
    accommodationOrDestinationCode: stores.layoutStore.accommodationOrDestinationCode,
    isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
    isShown:
        (stores.appStore.isScreenExtraSmall && stores.bookingStore.isShownMapOnMobile) ||
        stores.bookingStore.isShownMapOnDesktop,
    close: (): void => {
        stores.bookingStore.toggleMapVisibilityOnMobile(false);
        stores.bookingStore.toggleMapVisibilityOnDesktop(false);
    },
}))(observer(class WrappedHotelLocationBrowse extends HotelLocationBrowse {}));

export default ConnectedHotelLocationBrowse;

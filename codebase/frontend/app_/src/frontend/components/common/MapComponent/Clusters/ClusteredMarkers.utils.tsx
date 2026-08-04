import { Position } from 'geojson';

import { ONE_HUNDRED, TWO } from 'code/commonNumbers';
import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import { BaseLayoutStore } from 'frontend/store/base/layout/BaseLayoutStore';
import MarketStore from 'frontend/store/base/market/MarketStore';
import { BaseTrackingStore } from 'frontend/store/base/tracking/BaseTrackingStore';
import { toRealNumber } from 'frontend/utils/numbers';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IStop } from 'models/data/map/IItinerary';
import { ICluster, IGeoPoint, TSelectedMapCardData, TSetSelectedMapCardData } from 'models/data/map/IMap';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventActions } from 'models/enum/tracking/GenericEventParams';

export const SELECTED_Z_INDEX = 99999;
export const HOVERED_Z_INDEX = 999999;

export const getLatLng = (position: google.maps.LatLngLiteral | number[]): google.maps.LatLngLiteral => {
    if (Array.isArray(position)) {
        return {
            lat: position[1],
            lng: position[0],
        };
    }

    return position;
};

export const getOverlayPosition = (selected: TSelectedMapCardData): google.maps.LatLngLiteral => {
    const { stop, hotel } = selected || {};

    if (stop) return stop.position;

    return getLatLng(hotel!.geometry.coordinates);
};

export const getOffsetLatLng = (
    map: google.maps.Map,
    latLng: google.maps.LatLngLiteral,
    offsetX: number,
    offsetY: number,
): google.maps.LatLng | null => {
    const scale = Math.pow(TWO, map.getZoom()!);

    const proj = map.getProjection();

    if (!proj) return null;

    const point = proj.fromLatLngToPoint(latLng);

    if (!point) return null;

    const newPoint = new google.maps.Point(point.x + offsetX / scale, point.y + offsetY / scale);

    return proj.fromPointToLatLng(newPoint);
};

export const panToWithOffset = (
    map: google.maps.Map,
    position: google.maps.LatLngLiteral,
    offsetX: number,
    offsetY: number,
): void => {
    const offsetPosition = getOffsetLatLng(map, position, offsetX, offsetY);

    if (offsetPosition) {
        map.panTo(offsetPosition);
    }
};

export const fitBounds = ({
    map,
    list,
    padding = ONE_HUNDRED,
}: {
    list: (ICluster | IGeoPoint | IStop)[];
    map: google.maps.Map;
    padding?: number;
}): void => {
    if (!map || !list.length) return;

    const bounds = new google.maps.LatLngBounds();

    for (const item of list) {
        bounds.extend(getLatLng(item['geometry']?.['coordinates'] || item['position']));
    }

    map.fitBounds(bounds, padding);
};

export const onMouseEnter = (e): void => {
    e.target.style.zIndex = HOVERED_Z_INDEX;
};

export const onMouseLeave = (e): void => {
    e.target.style.zIndex = e.target.querySelector('[data-z-index]')?.dataset?.zIndex || 1;
};

export const centerMapCardVertically = (map: google.maps.Map, position: Position): void => {
    // we need to ensure the card fits within the map viewport
    // since the card’s height is unknown until it finishes loading,
    // we apply an approximate offset of 200 px
    const offsetY = -(TWO * ONE_HUNDRED);

    panToWithOffset(map, getLatLng(position), 0, offsetY);
};

interface IGetMarkerOnClickArgs {
    item: IGeoPoint;
    map: google.maps.Map;
    setSelected: TSetSelectedMapCardData;
    trackMapEvent: BaseTrackingStore['trackMapEvent'];
}

export const getMarkerOnClick =
    ({ setSelected, item, map, trackMapEvent }: IGetMarkerOnClickArgs) =>
    (): void => {
        // edge case: when an item has no id (usually hd-browse page)
        if (!item.properties.id) return;

        trackMapEvent({
            action: EventActions.MapPinClick,
            label: item.properties.id,
        });

        setSelected({ hotel: item });

        centerMapCardVertically(map, item.geometry.coordinates);
    };

interface IGetFormattedPriceArgs {
    formatMoney: MarketStore['formatMoney'];
    getPhrase: BaseLayoutStore['getPhrase'];
    isPricePerPerson: boolean;
    price: number;
    pricesHidden?: boolean;
}

export const getFormattedPrice = ({
    formatMoney,
    price,
    isPricePerPerson,
    getPhrase,
    pricesHidden = false,
}: IGetFormattedPriceArgs): string => {
    if (pricesHidden) return '';

    const formattedPrice = formatMoney(price, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    });

    return isPricePerPerson
        ? Tokenizer.replaceToken(
              getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
              Tokens.Price,
              formattedPrice,
          )
        : formattedPrice;
};

// We need to fix this on BE
// Add backend validation and remove duplicate hotels with identical coordinates
export const removeDuplicates = (features: IGeoPoint[], coordsForRemoval?: string): IGeoPoint[] => {
    if (!Array.isArray(features)) return features;

    const map = new Map();

    for (const f of features) {
        const key = f.geometry.coordinates.join();

        map.set(key, f);
    }

    if (coordsForRemoval) {
        map.delete(coordsForRemoval);
    }

    return Array.from(map.values());
};

const MAX_LNG = 180;
const MAX_LAT = 90;

export const isValidGeoPoint = (item: IGeoPoint): boolean => {
    const { coordinates } = item?.geometry || {};

    if (!Array.isArray(coordinates)) return false;

    if (coordinates.length === 0) return false;

    const [lng, lat] = coordinates.map(toRealNumber);

    if (lat === null || lng === null) return false;

    return Math.abs(lng) < MAX_LNG && Math.abs(lat) < MAX_LAT;
};

import { useEffect, useState } from 'react';
import { ControlPosition } from '@vis.gl/react-google-maps';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { MIN_TOTAL_ITEMS } from 'frontend/store/base/search/BaseSearchFilterStore';
import { TStores } from 'frontend/store/IStores';
import { IGeoPoint, TRestoreState, TSelectedMapCardData } from 'models/data/map/IMap';
import { isLoadingStatus } from 'models/enum/DataStatus';

export interface IMapPopupProps {
    onCloseMapPopup: () => void;
}

export interface IMapPopupData {
    amount: number;
    getPhrase: (key: string) => string;
    isLoading: boolean;
    isMobile: boolean;
    leftHandFilters: {
        isCollapsed: boolean;
        isOnMapPopup: boolean;
    };
    map: {
        defaultZoom: number;
        gestureHandling: string;
        hotels: IGeoPoint[];
        onSaveState: (zoom: number, selected: TSelectedMapCardData) => void;
        restoreState: TRestoreState;
        zoomControlPosition: ControlPosition;
    };
    mobileFilterModal: {
        isMobileFilterModalShown: boolean;
        map: boolean;
        onClose: () => void;
    };
    onClose: () => void;
    onOpen: () => void;
}

export interface IMapPopupState {
    accomId: string;
    zoomLevel: number;
}

const MAP_PARAMS = {
    minZoom: 2,
    defaultZoom: 4,
    zoomControlPosition: ControlPosition.RIGHT_BOTTOM,
};

export const useMapPopup = (props: IMapPopupProps): IMapPopupData => {
    const { onCloseMapPopup } = props;

    const [isShown, setIsShown] = useState(false);

    const {
        hotels,
        getPhrase,
        amount,
        areFiltersCollapsed,
        status,
        onChangeSearchFilterStore,
        mapPopupState,
        updateMapInQuery,
        updateMapStateInQuery,
    } = useStore((stores: TStores) => ({
        hotels: stores.hotelsStore.hotels,
        getPhrase: stores.layoutStore.getPhrase,
        status: stores.hotelsStore.status,
        amount: stores.searchFiltersStore.countableFilters.length,
        areFiltersCollapsed: stores.searchFiltersStore.areFiltersCollapsed,
        onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
        mapPopupState: stores.queryParamStore.mapPopupState,
        updateMapInQuery: stores.queryParamStore.updateMapInQuery,
        updateMapStateInQuery: stores.queryParamStore.updateMapStateInQuery,
    }));

    const isMobile = useMobileViewport();

    useEffect(() => {
        onChangeSearchFilterStore({ key: 'isMapModalDisplayed', value: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetSelectedFilterGroups = (): void => {
        onChangeSearchFilterStore({ key: 'selectedFilterGroups', value: new Set() });
    };

    const onSaveState = (zoomLevel: number, selected: TSelectedMapCardData): void => {
        // When a hotel card is selected, save its ID and zoom level to the URL.
        if (selected?.hotel) {
            updateMapStateInQuery(selected.hotel.properties.id, zoomLevel);
        } else {
            // Otherwise, set the m param to 1 to indicate that the map is open but no hotel is selected.
            updateMapInQuery(true);
        }
    };

    const restoreState = (): {
        selected: TSelectedMapCardData;
        zoomLevel: number;
    } | null => {
        if (!mapPopupState) return null;

        const { accomId, zoomLevel } = mapPopupState;
        const hotel = hotels?.find(h => h.properties.id === accomId) ?? null;

        if (!hotel) return null;

        return {
            zoomLevel,
            selected: { hotel },
        };
    };

    return {
        onClose: onCloseMapPopup,
        onOpen: (): void => {
            resetSelectedFilterGroups();
            setIsShown(true);
        },
        getPhrase,
        map: {
            ...MAP_PARAMS,
            hotels: hotels || [],
            gestureHandling: 'greedy',
            onSaveState,
            restoreState,
        },
        leftHandFilters: {
            isCollapsed: hotels ? hotels.length <= MIN_TOTAL_ITEMS : areFiltersCollapsed,
            isOnMapPopup: true,
        },
        isMobile,
        amount,
        mobileFilterModal: {
            isMobileFilterModalShown: isMobile && isShown,
            onClose: (): void => {
                resetSelectedFilterGroups();
                setIsShown(false);
            },
            map: true,
        },
        isLoading: isLoadingStatus(status),
    };
};

export default useMapPopup;

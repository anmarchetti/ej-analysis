import { useEffect, useState } from 'react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IMapFields } from 'models/data/map/IMap';
import { isLoadingStatus } from 'models/enum/DataStatus';
import { EventActions } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface ISearchResultsMapFields extends IMapFields {
    DesktopButton: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    IsSearchResultsMapButtonDisabled: ISitecoreField<boolean>;
    MobileButton: ISitecoreField<string>;
}

export type TSearchResultsMapProps = ISitecoreComponent<ISearchResultsMapFields>;

export interface IUseSearchResultsMap {
    button: {
        isOutlined: boolean;
        isText: boolean;
        onClick: () => void;
        title?: ISitecoreField<string>;
    };
    iconWrapperStyle: Record<string, string>;
    isDisplayed: boolean;
    isLoading: boolean;
    popup: {
        isMapPopupShown: boolean;
        onCloseMapPopup: () => void;
    };
}

export function useSearchResultMap(props: TSearchResultsMapProps): IUseSearchResultsMap {
    const {
        getFilteredHotels,
        cleanUpHotels,
        status,
        isFiltersLoaded,
        isMap,
        updateMapInQuery,
        setIsSelectedPackageFromMap,
        trackMapEvent,
        onChangeSearchFilterStore,
    } = useStore((stores: TStores) => ({
        getFilteredHotels: stores.hotelsStore.getFilteredHotels,
        cleanUpHotels: stores.hotelsStore.cleanUpHotels,
        status: stores.hotelsStore.status,
        isFiltersLoaded: stores.searchFiltersStore.isFiltersLoaded,
        isMap: stores.queryParamStore.isMap,
        updateMapInQuery: stores.queryParamStore.updateMapInQuery,
        setIsSelectedPackageFromMap: stores.searchStore.setIsSelectedPackageFromMap,
        trackMapEvent: stores.trackingStore.trackMapEvent,
        onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
    }));

    const isMobile = useMobileViewport();

    const [isPopupShown, setIsPopupShown] = useState(isMap);

    useEffect(() => {
        updateMapInQuery(isPopupShown);

        if (isPopupShown) {
            getFilteredHotels();
        } else {
            cleanUpHotels();
        }

        return setIsSelectedPackageFromMap(isPopupShown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPopupShown]);

    const { fields } = props;

    const { DesktopButton, MobileButton } = fields || {};
    const desktopMapImage = !isMobile && fields?.MapImage?.value?.src;

    return {
        isDisplayed: !!fields && !fields.IsSearchResultsMapButtonDisabled?.value,
        button: {
            isText: isMobile,
            isOutlined: !isMobile,
            onClick: () => setIsPopupShown(true),
            title: isMobile ? MobileButton : DesktopButton,
        },
        popup: {
            isMapPopupShown: isPopupShown,
            onCloseMapPopup: (): void => {
                setIsPopupShown(false);

                trackMapEvent({
                    action: EventActions.CloseMapClick,
                });

                onChangeSearchFilterStore({
                    cb: ctx => {
                        ctx.isMapModalDisplayed = false;
                        ctx.isFiltersLoaded = false;

                        ctx.rootStore.hotelsStore.defaultLoadResults();
                    },
                });
            },
        },
        iconWrapperStyle: desktopMapImage ? { backgroundImage: `url(${desktopMapImage})` } : {},
        isLoading: isLoadingStatus(status) && !isFiltersLoaded,
    };
}

export default useSearchResultMap;

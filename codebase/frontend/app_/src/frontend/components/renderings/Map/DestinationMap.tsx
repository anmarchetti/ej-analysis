import { useEffect, useMemo, useRef, useState } from 'react';
import { ControlPosition } from '@vis.gl/react-google-maps';
import Axios, { CancelTokenSource } from 'axios';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useHolidaysDestinationPageTypeName from 'frontend/hooks/useHolidaysDestinationPageTypeName';
import useStore from 'frontend/hooks/useStore';
import { HotelsService } from 'frontend/services/hotels.service';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { IGeoPoint, IMapFields, IMapParams } from 'models/data/map/IMap';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import LoadingAnimation from 'frontend/components/common/LoadingAnimation/LoadingAnimation';
import { getLatLng, removeDuplicates } from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';
import MapComponent from 'frontend/components/common/MapComponent/MapComponent';
import { Popup } from 'frontend/components/common/Popup';
import RegionAnchor from 'frontend/components/common/RegionAnchor/RegionAnchor';
import IconMapMarker from 'frontend/components/icons/MapMarker';
import Cross from 'frontend/components/icons-new/Cross';

import styles from './DestinationMap.module.scss';

const ConditionalWrapper = ({ condition, wrapper, children }) => (condition ? wrapper(children) : children);

type TDestinationMapProps = ISitecoreComponent<IMapFields, IMapParams>;

const DestinationMap = (props: TDestinationMapProps) => {
    const {
        destCode,
        isMapEnabledOnDesktop,
        isMapVisibleOnDesktop,
        isMapVisibleOnMobile,
        isScreenExtraSmall,
        location,
        getPhrase,
        toggleMapOnDesktop,
        toggleMapOnMobile,
        trackEventWithParams,
        trackMapEvent,
    } = useStore((stores: TStores) => ({
        destCode: stores.layoutStore.layout?.sitecore?.route?.fields?.Code?.value,
        isMapEnabledOnDesktop: stores.layoutStore.isDestinationMapEnableOnDesktop,
        isMapVisibleOnDesktop: stores.bookingStore.isShownDestinationMapOnDesktop,
        isMapVisibleOnMobile: stores.bookingStore.isShownDestinationMapOnMobile,
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
        location: stores.layoutStore.layout?.sitecore?.route?.fields?.Name?.value,
        getPhrase: stores.layoutStore.getPhrase,
        toggleMapOnDesktop: stores.bookingStore.toggleDestinationMapVisibilityOnDesktop,
        toggleMapOnMobile: stores.bookingStore.toggleDestinationMapVisibilityOnMobile,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        trackMapEvent: stores.trackingStore.trackMapEvent,
    }));

    const { fields, params } = props;
    const { ExploreContent, MapImage, CTA } = fields || {};

    const [hotels, setHotels] = useState<IGeoPoint[]>([]);
    const cancelToken = useRef<Nullable<CancelTokenSource>>(null);

    const mapParams = useMemo(() => {
        const { MaxZoom, MinZoom, InitialZoom } = params;

        const hotel = hotels.find(({ geometry }) => geometry.coordinates);

        if (!hotel) return undefined;

        return {
            minZoom: +MinZoom,
            maxZoom: +MaxZoom,
            defaultZoom: +InitialZoom,
            center: getLatLng(hotel.geometry.coordinates),
            zoomControlPosition: isScreenExtraSmall ? ControlPosition.RIGHT_BOTTOM : undefined,
            closeControlPosition: isScreenExtraSmall ? ControlPosition.TOP_RIGHT : undefined,
            gestureHandling: isScreenExtraSmall ? 'greedy' : undefined,
        };
    }, [hotels]);

    const isMapVisible = useMemo(
        () => (isScreenExtraSmall ? isMapVisibleOnMobile : isMapVisibleOnDesktop),
        [isMapVisibleOnDesktop, isMapVisibleOnMobile, isScreenExtraSmall],
    );
    const holidaysDestinationPageTypeName = useHolidaysDestinationPageTypeName();

    useEffect(() => {
        initialize();
    }, [destCode]);

    useEffect(() => {
        toggleMapOnMobile(false);
        toggleMapOnDesktop(false);
    }, [isScreenExtraSmall]);

    useEffect(() => {
        if (isMapVisible) {
            getOffers();
        }
    }, [isMapVisible]);

    const initialize = () => {
        const isMapVisibleOnDesktop = isScreenExtraSmall ? false : isMapEnabledOnDesktop;
        toggleMapOnDesktop(isMapVisibleOnDesktop);
        isMapVisibleOnDesktop ? getOffers() : clearOffers();
    };

    const getOffers = async () => {
        if (cancelToken.current) {
            cancelToken.current?.cancel();
            cancelToken.current = null;
        }

        if (!destCode) return;

        try {
            cancelToken.current = Axios.CancelToken.source();

            const { features = [] } = await HotelsService.fetchDestinationHotels(destCode);

            setHotels(removeDuplicates(features));
        } catch (e) {
            clearOffers();
        }
    };

    const clearOffers = (): void => {
        setHotels([]);
        toggleMapOnDesktop(false);
        toggleMapOnMobile(false);
    };

    const toggleMap = (shouldTrackClick: boolean) => {
        if (shouldTrackClick && holidaysDestinationPageTypeName) {
            const customParams = generateGenericValues({
                genericValue1: holidaysDestinationPageTypeName,
                destinationUrl: null,
            });

            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.Map,
                    eventCategory: EventCategories.DestinationGuide,
                    eventLabel: 'View Map',
                    eventType: EventTypes.Interaction,
                },
                customParams,
            );
        }

        isScreenExtraSmall ? toggleMapOnMobile(!isMapVisibleOnMobile) : toggleMapOnDesktop(!isMapVisibleOnDesktop);
    };

    const locationLabel = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.DestinationsButtonsMapTitle),
        Tokens.Region,
        location,
    );

    const exploreLabel = Tokenizer.replaceToken(ExploreContent?.value, Tokens.Region, location);

    return (
        <>
            <div className={styles.wrapper}>
                <div className={styles.mapWrapper} data-tid='destination-wrapper'>
                    <div className={styles.mapImage}>
                        <JSSImageNext field={MapImage} fill mediaSize={MediaSize.Small} />
                        <IconMapMarker className={`${styles.mapIcon} d-md-none`} />
                    </div>
                    <div className={styles.contentWrapper}>
                        <IconMapMarker className={`${styles.mapIcon} d-none d-md-block`} />
                        <p className={styles.exploreText}>{exploreLabel}</p>
                        <Button onClick={() => toggleMap(true)} isOutlined dataTid='destination-toggle'>
                            {getPhrase(SitecoreDictionary.DestinationsButtonsViewMap)}
                        </Button>
                    </div>
                </div>

                {!!CTA?.fields?.Link && <RegionAnchor Link={CTA.fields.Link} />}
            </div>

            {isMapVisible && (
                <ConditionalWrapper
                    condition={!isScreenExtraSmall}
                    wrapper={(children: JSX.Element) => (
                        <Popup
                            dialogClass={styles.dialogClass}
                            contentClass={styles.contentClass}
                            bodyClass={styles.bodyClass}
                            id='destination-map-popup'
                        >
                            <div className={styles.titleSection}>
                                <p className={styles.title}>{locationLabel}</p>
                                <p
                                    className={styles.closeSection}
                                    onClick={() => {
                                        toggleMap(false);

                                        trackMapEvent({
                                            action: EventActions.CloseMapClick,
                                        });
                                    }}
                                    data-tid='destination-popup-close'
                                >
                                    {getPhrase(SitecoreDictionary.DestinationsButtonsCloseMap)} <Cross />
                                </p>
                            </div>
                            {children}
                        </Popup>
                    )}
                >
                    {!hotels.length && !mapParams ? (
                        <div className={isScreenExtraSmall ? styles.map : undefined}>
                            <LoadingAnimation isCentered />
                        </div>
                    ) : (
                        <MapComponent
                            {...mapParams}
                            className={isScreenExtraSmall ? styles.map : undefined}
                            hotels={hotels}
                            onUnmount={clearOffers}
                            clickableIcons={!isScreenExtraSmall}
                        />
                    )}
                </ConditionalWrapper>
            )}
        </>
    );
};

export default observer(DestinationMap);

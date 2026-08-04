import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ControlPosition } from '@vis.gl/react-google-maps';

import { cmsUrls } from 'code/endpoints';
import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { HotelsService } from 'frontend/services/hotels.service';
import { IImage } from 'models/data/IHotel';
import { IStop, ITour, TOnRouteChange } from 'models/data/map/IItinerary';
import { IGeoPoint } from 'models/data/map/IMap';
import { removeDuplicates } from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';
import MapComponent from 'frontend/components/common/MapComponent/MapComponent';

import styles from './ItineraryGuide.module.scss';

interface IItineraryGuideProps {
    onRouteChange: TOnRouteChange;
    tour: ITour;
    selectedStop?: IStop;
}

const ItineraryGuide: React.FC<IItineraryGuideProps> = ({ onRouteChange, tour, selectedStop }) => {
    const { destinationCode } = useStore(stores => ({
        destinationCode: stores.layoutStore.destinationCode,
    }));

    const isScreenExtraSmall = useXSMobileViewport();

    const [hotels, setHotels] = useState<IGeoPoint[]>([]);

    useEffect(() => {
        if (!destinationCode) return;

        HotelsService.fetchDestinationHotels(destinationCode)
            .then(({ features = [] }) => {
                setHotels(removeDuplicates(features));
            })
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            .catch(() => {});
    }, [destinationCode]);

    const route: IStop[] = useMemo(
        () =>
            tour.children?.map(el => {
                const { children, fields } = el;
                const { Duration, Name, Description, Latitude, Longitude, RouteType, Subtitle } = fields;

                const images: IImage[] =
                    children
                        ?.find(child => child.name === 'Images')
                        ?.children.map(child => ({ medium: cmsUrls.media(child.fields.Image.value.src) })) || [];

                return {
                    name: Name.value,
                    position: {
                        lng: +Longitude.value,
                        lat: +Latitude.value,
                    },
                    description: Description.value,
                    duration: Duration.value,
                    subtitle: Subtitle.value,
                    travelMode: RouteType.value as google.maps.TravelMode,
                    images,
                    id: el.id,
                };
            }),
        [tour],
    );

    return (
        <MapComponent
            className={styles.map}
            hotels={hotels}
            route={route}
            selectedStop={selectedStop}
            onRouteChange={onRouteChange}
            zoomControlPosition={isScreenExtraSmall ? ControlPosition.RIGHT_BOTTOM : undefined}
            clickableIcons
        />
    );
};

export default ItineraryGuide;

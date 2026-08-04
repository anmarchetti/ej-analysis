import React, { FC, useState } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { ITour } from 'models/data/map/IItinerary';
import { EventActions, EventLabels } from 'models/enum/tracking/GenericEventParams';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import { CarouselButton } from 'frontend/components/renderings/SearchResults/components/OffersCarouselButton';

import DestinationMapModal from './DestinationMapModal/DestinationMapModal';
import ItineraryItem from './ItineraryItem/ItineraryItem';

import styles from './DestinationGuides.module.scss';

interface IDestinationGuidesProps {
    tours: ITour[];
}
const DestinationGuides: FC<IDestinationGuidesProps> = ({ tours }) => {
    const [isGuideOpened, setIsGuideOpened] = useState<Nullable<boolean>>(null);
    const [selected, setSelected] = useState<Nullable<string>>(null);

    const { trackMapEvent } = useStore(stores => ({
        trackMapEvent: stores.trackingStore.trackMapEvent,
    }));

    const responsive: ResponsiveType = {
        desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 }, items: 3 },
        tablet: { breakpoint: { max: 1024, min: 768 }, items: 2 },
        mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
    };

    const onOpenRouteMap = (ev): void => {
        setIsGuideOpened(true);
        setSelected(ev.currentTarget.dataset.tid);

        trackMapEvent({
            action: EventActions.OpenRouteMap,
            label: EventLabels.DestinationGuide,
        });
    };

    const onCloseRouteMap = (): void => {
        setIsGuideOpened(false);
        setSelected(null);

        trackMapEvent({
            action: EventActions.CloseMapClick,
        });
    };

    const MIN_CAROUSEL_LENGTH = 3;

    const isCarousel = tours.length > MIN_CAROUSEL_LENGTH;

    const className = isCarousel ? styles.carousel : classNames(styles.carousel, styles.tourGuideBlockSmart);

    return (
        <div className={styles.tourGuideBlock}>
            <div className={className} data-tid='destination-guides-carousel-wrapper'>
                <CarouselWrapper
                    arrows={false}
                    responsive={responsive}
                    containerClass={styles.carouselContainer}
                    itemClass={styles.carouselItem}
                    showDots
                    customButtonGroup={<CarouselButton />}
                    draggable={false}
                >
                    {tours.map(
                        ({
                            id,
                            displayName,
                            fields: { Image, Name, Description, TotalDistance, Duration },
                            children: itinerary,
                        }) => (
                            <ItineraryItem
                                key={displayName}
                                Image={Image}
                                Name={Name}
                                Description={Description}
                                id={id}
                                onOpenRouteMap={onOpenRouteMap}
                                Duration={Duration}
                                TotalDistance={TotalDistance}
                                itinerary={itinerary}
                            />
                        ),
                    )}
                </CarouselWrapper>
            </div>
            {!isCarousel && (
                <div className={styles.tourGuideBlockDesc} data-tid='destination-guides-desc-wrapper'>
                    {tours.map(el => (
                        <ItineraryItem
                            key={el.displayName + el.id}
                            Image={el.fields.Image}
                            Name={el.fields.Name}
                            Description={el.fields.Description}
                            id={el.id}
                            onOpenRouteMap={onOpenRouteMap}
                            Duration={el.fields.Duration}
                            TotalDistance={el.fields.TotalDistance}
                            itinerary={el.children}
                        />
                    ))}
                </div>
            )}
            {isGuideOpened && (
                <DestinationMapModal tours={tours} expandedSection={selected} onClose={onCloseRouteMap} />
            )}
        </div>
    );
};

export default DestinationGuides;

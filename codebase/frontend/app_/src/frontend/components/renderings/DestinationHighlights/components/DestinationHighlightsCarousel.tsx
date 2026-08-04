import { FunctionComponent, Ref } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IDestinationHighlightItem } from 'models/data/IDestinationHighlightItem';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import CarouselWrapper, { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import IconChevronLeft from 'frontend/components/icons/ChevronLeft';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import DestinationHighlightsCard from './DestinationHighlightsCard';

interface IDestinationHighlightsCarouselProps {
    isFullWidth: boolean;
    isSwipeable: boolean;
    items: IDestinationHighlightItem[];
    responsive: ResponsiveType;
    ssrDeviceType: string; // should be key name of responsive config
    carouselRef?: Ref<TCarouselRef>;
}

export const DestinationHighlightsCarousel: FunctionComponent<IDestinationHighlightsCarouselProps> = ({
    items,
    isFullWidth,
    isSwipeable,
    responsive,
    ssrDeviceType,
    carouselRef,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));

    return (
        <div className='destinations-highlights__carousel-wrapper'>
            <CarouselWrapper
                ref={carouselRef}
                responsive={responsive}
                containerClass={classNames('destinations-highlights__carousel', isFullWidth && 'full-width')}
                arrows={true}
                customLeftArrow={
                    <button
                        className='destination-highlights__slide-button slide-button prev'
                        data-tid='slide-button-prev'
                        aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPreviousButton)}
                    >
                        <IconChevronLeft />
                    </button>
                }
                customRightArrow={
                    <button
                        className='destination-highlights__slide-button slide-button next'
                        data-tid='slide-button-next'
                        aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsNextButton)}
                    >
                        <IconChevronRight />
                    </button>
                }
                showDots={isSwipeable}
                infinite={false}
                swipeable={isSwipeable}
                deviceType={ssrDeviceType}
                ssr={true}
            >
                {items.map(item => (
                    <div key={item.id} className='slide-wrapper'>
                        <DestinationHighlightsCard item={item} />
                    </div>
                ))}
            </CarouselWrapper>
        </div>
    );
};

export default DestinationHighlightsCarousel;

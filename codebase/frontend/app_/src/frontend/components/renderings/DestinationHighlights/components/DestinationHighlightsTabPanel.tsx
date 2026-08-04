import { FunctionComponent, useEffect, useRef } from 'react';
import { ResponsiveType } from 'react-multi-carousel';

import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { IDestinationHighlightTabItem } from 'models/data/IDestinationHighlightTabItem';
import { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';

import DestinationHighlightsCarousel from './DestinationHighlightsCarousel';

interface IDestinationHighlightsTabPanelProps {
    isActiveTab: boolean;
    tabItem: IDestinationHighlightTabItem;
}

const responsiveConfig: ResponsiveType = {
    tabletDesktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 768 }, items: 2 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};

export const DestinationHighlightsTabPanel: FunctionComponent<IDestinationHighlightsTabPanelProps> = ({
    tabItem,
    isActiveTab,
}) => {
    const carouselRef = useRef<TCarouselRef | null>(null);
    const items = tabItem.fields?.Highlights || [];
    const isSwipeable = items.length > responsiveConfig.tabletDesktop.items;

    useEffect(() => {
        if (isActiveTab && carouselRef.current) {
            carouselRef.current.goToSlide(0);
        }
    }, [isActiveTab]);

    return (
        <div
            className={isActiveTab ? undefined : 'd-none'}
            data-tid='destination-highlights-tab-panel'
            id={`destination-highlights-tab-panel-${tabItem.id}`}
        >
            <DestinationHighlightsCarousel
                carouselRef={carouselRef}
                items={items}
                isSwipeable={isSwipeable}
                isFullWidth={!isSwipeable}
                responsive={responsiveConfig}
                ssrDeviceType={carouselRef.current?.state.deviceType || 'tabletDesktop'}
            />
        </div>
    );
};

export default DestinationHighlightsTabPanel;

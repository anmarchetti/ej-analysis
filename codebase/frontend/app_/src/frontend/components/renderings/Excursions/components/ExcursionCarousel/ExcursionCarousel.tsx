import React, { FC } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import classNames from 'classnames';

import { useMobileViewport, useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { IExcursion } from 'models/data/IExcursions';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import SliderButtonsGroup from 'frontend/components/common/SliderButtonsGroup';
import ExcursionItem from 'frontend/components/renderings/Excursions/components/ExcursionItem/ExcursionItem';
import { IExcursionsFields, IExcursionsParams } from 'frontend/components/renderings/Excursions/Excursions';
import {
    DESKTOP_ITEMS_AMOUNT,
    getShowDots,
    hideArrows,
    HORIZONTAL_VIEW_AMOUNT,
    TABLET_ITEMS_AMOUNT,
} from 'frontend/components/renderings/Excursions/Excursions.utils';

import styles from './ExcursionCarousel.module.scss';

export interface IExcursionCarouselProps {
    excursions: IExcursion[];
    fields: IExcursionsFields;
    params: IExcursionsParams;
    trackExcursion?: (item: IExcursion) => void;
}

const ExcursionCarousel: FC<IExcursionCarouselProps> = ({ fields, excursions, params, trackExcursion }) => {
    const { descriptionMaxLines } = useStore(stores => ({
        descriptionMaxLines: stores.layoutStore.excursionDescriptionMaxLines,
    }));

    const isMobile = useMobileViewport();
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const responsive: ResponsiveType = {
        desktop: {
            breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 992 },
            items: excursions.length > DESKTOP_ITEMS_AMOUNT ? DESKTOP_ITEMS_AMOUNT : excursions.length,
        },
        tablet: {
            breakpoint: { max: 991, min: 768 },
            items: excursions.length > TABLET_ITEMS_AMOUNT ? TABLET_ITEMS_AMOUNT : excursions.length,
        },
        mobile: {
            breakpoint: { max: 767, min: 0 },
            items: 1,
        },
    };

    const isHorizontalView = !isMobile && excursions.length <= HORIZONTAL_VIEW_AMOUNT;
    const showDots = getShowDots(excursions.length, isMobile, isMoreThenTabletViewport);
    const isArrowsHidden = hideArrows(excursions, !isMobile, isMoreThenTabletViewport);

    return (
        <div className={styles.excursionsCarousel}>
            <CarouselWrapper
                responsive={responsive}
                arrows={false}
                showDots={showDots}
                swipeable
                draggable={false}
                partialVisible={false}
                itemClass={classNames({ [styles.item]: !isHorizontalView })}
                sliderClass={classNames({ [styles.centralSlider]: !params.isLeftAligned })}
                renderButtonGroupOutside={true}
                customButtonGroup={!isArrowsHidden ? <SliderButtonsGroup buttonClass={styles.slideButton} /> : null}
                renderDotsOutside
            >
                {excursions.map((item, i) => (
                    <ExcursionItem
                        fields={fields}
                        params={params}
                        item={item}
                        key={i}
                        index={i}
                        descriptionMaxLines={descriptionMaxLines}
                        trackExcursion={trackExcursion}
                        isHorizontalView={isHorizontalView}
                        className={classNames(
                            showDots && styles.excursionItem,
                            params.isLeftAligned && styles.leftAligned,
                        )}
                    />
                ))}
            </CarouselWrapper>
        </div>
    );
};

export default ExcursionCarousel;

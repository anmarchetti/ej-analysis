import React from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import IconChevronLeft from 'frontend/components/icons/ChevronLeft';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

// Doubled with ButtonGroup - Refactoring required
const SliderButtonsGroup = ({ next, previous, buttonClass, ...rest }: any) => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));

    const { currentSlide, totalItems, slidesToShow } = rest?.carouselState || {};

    return (
        <>
            <button
                className={classNames('slide-button prev', buttonClass, {
                    'd-none': currentSlide === 0,
                })}
                onClick={previous}
                data-tid='slide-button-prev'
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPreviousButton)}
            >
                <IconChevronLeft />
            </button>
            <button
                className={classNames('slide-button next', buttonClass, {
                    'd-none': currentSlide + slidesToShow >= totalItems,
                })}
                onClick={next}
                data-tid='slide-button-next'
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsNextButton)}
            >
                <IconChevronRight />
            </button>
        </>
    );
};

export default SliderButtonsGroup;

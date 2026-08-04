import * as React from 'react';
import { FC } from 'react';
import { ButtonGroupProps } from 'react-multi-carousel';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import styles from './CarouselButtonsGroup.module.scss';

const DEFAULT_MIN_NUMBER_OF_ITEMS = 3;

export interface ICarouselButtonsGroupProps extends ButtonGroupProps {
    minNumberOfItems?: number;
    nextClassName?: string;
    prevClassName?: string;
}

export const CarouselButtonsGroup: FC<ICarouselButtonsGroupProps> = ({
    next,
    previous,
    carouselState,
    minNumberOfItems = DEFAULT_MIN_NUMBER_OF_ITEMS,
    prevClassName,
    nextClassName,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({ getPhrase: stores.layoutStore.getPhrase }));

    if (!next || !previous || !carouselState) {
        return null;
    }

    const { currentSlide, totalItems, slidesToShow } = carouselState;
    const isPrevDisabled = currentSlide === 0;
    const isNextDisabled = totalItems - slidesToShow === currentSlide;
    const prevClassNames = classNames(
        styles.carouselButton,
        styles.prev,
        isPrevDisabled && styles.disabled,
        prevClassName,
    );
    const nextClassNames = classNames(
        styles.carouselButton,
        styles.next,
        isNextDisabled && styles.disabled,
        nextClassName,
    );

    if (totalItems <= minNumberOfItems) {
        return null;
    }

    return (
        <>
            <Button
                disabled={isPrevDisabled}
                onClick={(): void => previous()}
                isText
                className={prevClassNames}
                dataTid='carousel-button-previous'
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPreviousButton)}
            >
                <SvgChevronLeft />
            </Button>

            <Button
                disabled={isNextDisabled}
                onClick={(): void => next()}
                isText
                className={nextClassNames}
                dataTid='carousel-button-next'
                aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsNextButton)}
            >
                <SvgChevronRight />
            </Button>
        </>
    );
};

export default CarouselButtonsGroup;

import React from 'react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import GraphNavigationButton from './GraphNavigationButton';

import styles from './GraphNavigation.module.scss';

interface IGraphNavigationProps {
    isNextDisabled: boolean;
    isPrevDisabled: boolean;
    showNextDates: () => void;
    showPrevDates: () => void;
}

const GraphNavigation = ({ showPrevDates, showNextDates, isNextDisabled, isPrevDisabled }: IGraphNavigationProps) => (
    <>
        <GraphNavigationButton
            dataTid='prev-dates-btn'
            label={SitecoreDictionary.PriceGraphButtonsPreviousDates}
            icon={<SvgChevronLeft />}
            isDisabled={isPrevDisabled}
            onClick={showPrevDates}
        />

        <GraphNavigationButton
            btnClass={styles.next}
            dataTid='next-dates-btn'
            label={SitecoreDictionary.PriceGraphButtonsNextDates}
            icon={<SvgChevronRight />}
            isDisabled={isNextDisabled}
            onClick={showNextDates}
        />
    </>
);

export default GraphNavigation;

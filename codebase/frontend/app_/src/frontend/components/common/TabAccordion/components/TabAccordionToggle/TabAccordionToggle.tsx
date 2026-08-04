import React, { FC } from 'react';
import classNames from 'classnames';

import Button from 'frontend/components/common/Button';
import { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import styles from './TabAccordionToggle.module.scss';

export interface ITabAccordionToggleProps {
    isOpened: boolean;
    tab: ITabItem;
    children?: JSX.Element;
    onTabClick?: (tab: ITabItem) => void;
    tabToggleClassName?: string;
    tabToggleSelectedClassName?: string;
}

const TabAccordionToggle: FC<ITabAccordionToggleProps> = ({
    onTabClick,
    isOpened,
    children,
    tab,
    tabToggleClassName,
    tabToggleSelectedClassName,
}) => (
    <Button
        className={classNames(
            styles.button,
            tabToggleClassName,
            isOpened && styles.buttonSelected,
            isOpened && tabToggleSelectedClassName,
        )}
        onClick={(): void => onTabClick?.(tab)}
        aria-expanded={isOpened}
        isFullWidth
        isText
        data-tid={`tab-toggle`}
    >
        {children}
        <IconChevronRight />
    </Button>
);

export default TabAccordionToggle;

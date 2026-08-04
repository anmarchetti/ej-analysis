import React, { FC, useEffect, useRef } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import Button from 'frontend/components/common/Button';
import { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import IconChevronDown from 'frontend/components/icons/ChevronDown';

import styles from './TabAccordionCollapse.module.scss';

export interface ITabAccordionCollapseProps {
    isOpened: boolean;
    renderContent: (tab: ITabItem) => React.ReactNode;
    tab: ITabItem;
    onTabClick?: (tab: ITabItem) => void;
    scrollIntoView?: boolean;
    tabCollapseBtnClassName?: string;
    tabCollapseBtnSelectedClassName?: string;
    tabCollapseClassName?: string;
}

export const TabAccordionCollapse: FC<ITabAccordionCollapseProps> = ({
    tab,
    isOpened,
    onTabClick,
    renderContent,
    scrollIntoView,
    tabCollapseBtnClassName,
    tabCollapseBtnSelectedClassName,
    tabCollapseClassName,
}) => {
    const tabCollapseRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollIntoView && isOpened && tabCollapseRef.current) {
            tabCollapseRef.current.scrollIntoView();
        }
    }, [scrollIntoView, isOpened, tab]);

    return (
        <div
            className={classNames(styles.container, tabCollapseClassName)}
            data-expanded={isOpened}
            ref={tabCollapseRef}
            data-tid='tab-collapse'
        >
            <Button
                className={classNames(
                    styles.button,
                    tabCollapseBtnClassName,
                    isOpened && tabCollapseBtnSelectedClassName,
                    isOpened && styles.buttonSelected,
                )}
                onClick={(): void => onTabClick?.(tab)}
                aria-expanded={isOpened}
                isFullWidth
                isText
                data-tid='tab-collapse-button'
            >
                <Text field={tab.TitleTab} tag='span' />
                <IconChevronDown />
            </Button>
            {renderContent(tab)}
        </div>
    );
};

export default TabAccordionCollapse;

import React, { FC, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import TabAccordionCollapse from './components/TabAccordionCollapse/TabAccordionCollapse';
import TabAccordionToggle from './components/TabAccordionToggle/TabAccordionToggle';

import styles from './TabAccordion.module.scss';

export interface ITabItem {
    id: string;
    ContentTab?: ISitecoreField<string>;
    TitleTab?: ISitecoreField<string>;
}
export interface ITabAccordionProps {
    items: ITabItem[];
    renderContent: (tab: ITabItem) => React.ReactNode;
    defaultSelectedTabId?: string;
    id?: string;
    onTabClick?: (tab: ITabItem) => void;
    scrollIntoView?: boolean;
    tabAccordionClassName?: string;
    tabCollapseBtnClassName?: string;
    tabCollapseBtnSelectedClassName?: string;
    tabToggleClassName?: string;
    tabToggleSelectedClassName?: string;
}

const TabAccordion: FC<ITabAccordionProps> = ({
    id,
    items,
    renderContent,
    defaultSelectedTabId,
    onTabClick,
    tabAccordionClassName,
    tabToggleClassName,
    tabToggleSelectedClassName,
    scrollIntoView,
    tabCollapseBtnClassName,
    tabCollapseBtnSelectedClassName,
}) => {
    const tabAccordionRef = useRef<HTMLDivElement>(null);
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const [selectedTab, setSelectedTab] = useState<Nullable<ITabItem>>(null);
    const [isTabSelectedByUser, setIsTabSelectedByUser] = useState(false);

    useEffect(() => {
        if (isMoreThenTabletViewport && !selectedTab) {
            setSelectedTab(items[0]);
            setIsTabSelectedByUser(false);
        }

        if (!isMoreThenTabletViewport && !isTabSelectedByUser) {
            setSelectedTab(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMoreThenTabletViewport]);

    useEffect(() => {
        if (defaultSelectedTabId) {
            setSelectedTab(items.find(tab => tab.id === defaultSelectedTabId));
            scrollIntoView && tabAccordionRef.current?.scrollIntoView();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultSelectedTabId, scrollIntoView]);

    const onSelectTab = (tab: ITabItem): void => {
        setIsTabSelectedByUser(true);

        if (!isMoreThenTabletViewport && selectedTab?.id === tab.id) {
            setSelectedTab(null);
        } else {
            setSelectedTab(tab);
        }

        scrollIntoView && tabAccordionRef.current?.scrollIntoView();
        onTabClick?.(tab);
    };

    return (
        <div
            id={id}
            className={classNames(styles.container, tabAccordionClassName)}
            ref={tabAccordionRef}
            data-tid='tab-accordion'
        >
            {isMoreThenTabletViewport && (
                <>
                    <div className={styles.categoriesContainer}>
                        {items.map(tab => (
                            <TabAccordionToggle
                                tab={tab}
                                isOpened={selectedTab?.id === tab.id}
                                key={tab.id}
                                onTabClick={onSelectTab}
                                tabToggleClassName={tabToggleClassName}
                                tabToggleSelectedClassName={tabToggleSelectedClassName}
                            >
                                <Text field={tab.TitleTab} tag='span' />
                            </TabAccordionToggle>
                        ))}
                    </div>
                    <div className={styles.tabPanels}>
                        {items.map(tab => (
                            <div
                                key={tab.id}
                                className={classNames(styles.tabPanel, {
                                    [styles.active]: selectedTab?.id === tab.id,
                                })}
                                data-tab-content={tab.id}
                            >
                                {renderContent(tab)}
                            </div>
                        ))}
                    </div>
                </>
            )}
            {!isMoreThenTabletViewport &&
                items.map(tab => (
                    <TabAccordionCollapse
                        tab={tab}
                        isOpened={selectedTab?.id === tab.id}
                        key={tab.id}
                        onTabClick={onSelectTab}
                        renderContent={renderContent}
                        scrollIntoView={scrollIntoView && !isTabSelectedByUser}
                        tabCollapseBtnClassName={tabCollapseBtnClassName}
                        tabCollapseBtnSelectedClassName={tabCollapseBtnSelectedClassName}
                    />
                ))}
        </div>
    );
};

export default TabAccordion;

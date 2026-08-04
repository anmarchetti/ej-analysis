import React, { RefObject, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import { switchTabOnArrowPress } from 'frontend/utils/a11y.utils';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import Tab from './Tab/Tab';

import styles from './tabs.module.scss';

export interface ITab {
    content: React.ReactNode;
    key: string;
    isDisabled?: boolean;
    title?: string | React.ReactNode;
}

interface ITabsProps {
    dataTid: string;
    tabs: ITab[];
    containerClass?: string;
    defaultKeyActive?: string;
    onChange?: (key: string, element?: RefObject<HTMLButtonElement>) => void;
    showArrow?: boolean;
    tabActionClass?: string;
    tabActiveClass?: string;
    tabPanelClass?: string;
    tabsWrapperClass?: string;
}

const INDICATOR_WIDTH_PADDING = 4;

function Tabs({
    tabs,
    dataTid,
    defaultKeyActive,
    containerClass,
    tabsWrapperClass,
    tabActionClass,
    tabActiveClass,
    tabPanelClass,
    showArrow,
    onChange,
}: ITabsProps) {
    const [activeTab, setActive] = useState<string>(defaultKeyActive || tabs[0]?.key);
    const [isArrowVisible, setIsArrowVisible] = useState<boolean>(false);

    const indicatorRef = useRef<HTMLDivElement>(null);
    const tabWrapperRef = useRef<HTMLDivElement>(null);
    const selectedTabRef = useRef<HTMLButtonElement>(null);

    const tabClassNames = {
        tabAction: tabActionClass ?? styles.tabAction,
        active: tabActiveClass ?? styles.active,
    };

    const toggleActive = (key: string) => {
        setActive(key);
    };

    const handleIndicator = () => {
        if (!indicatorRef.current || !selectedTabRef.current) return;

        indicatorRef.current.style.width = `${selectedTabRef.current.offsetWidth - INDICATOR_WIDTH_PADDING * 2}px`;
        indicatorRef.current.style.left = `${selectedTabRef.current.offsetLeft + INDICATOR_WIDTH_PADDING}px`;
    };

    const handleTabsKeySwitch = (e: React.KeyboardEvent) => {
        const toLeft = e.keyCode === 37;
        const toRight = e.keyCode === 39;

        if (!toLeft && !toRight) return;

        const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
        const nextIndex = switchTabOnArrowPress(e, activeIndex, tabs.length) || 0;
        setActive(tabs[nextIndex].key);
        const tab = document?.getElementById(`tab-${dataTid}-${nextIndex}`) as HTMLButtonElement;
        tab?.focus();
    };

    const handleArrow = () => {
        if (!tabWrapperRef.current) {
            setIsArrowVisible(false);

            return;
        }

        const { current } = tabWrapperRef;

        const isOverflowing = current.clientWidth < current.scrollWidth || current.clientHeight < current.scrollHeight;
        const isEnd = Math.round(current.scrollLeft + current.offsetWidth) === current.scrollWidth;
        const isVisible = isOverflowing && !isEnd;
        setIsArrowVisible(isVisible);
    };

    const handleIndicators = () => {
        handleIndicator();
        handleArrow();
    };

    useEffect(() => {
        onChange?.(activeTab, selectedTabRef);
        handleIndicators();
    }, [activeTab]);

    useEffect(() => {
        window.addEventListener('resize', handleIndicators);

        return () => {
            window.removeEventListener('resize', handleIndicators);
        };
    }, []);

    return (
        <div className={containerClass}>
            <div className={styles.tabWrapper}>
                <div
                    ref={tabWrapperRef}
                    data-tid={dataTid}
                    className={`${styles.tabs} ${tabsWrapperClass}`}
                    role='tablist'
                    aria-orientation='horizontal'
                    onKeyDown={handleTabsKeySwitch}
                    onScroll={handleArrow}
                >
                    {tabs.map(({ title = '', key, isDisabled = false }, i) => {
                        const id = `tab-${dataTid}-${i}`;

                        return (
                            <button
                                key={key}
                                ref={activeTab === key ? selectedTabRef : null}
                                data-tid={id}
                                id={id}
                                role='tab'
                                type='button'
                                aria-selected={activeTab === key}
                                aria-controls={`tabpanel-${dataTid}-${i}`}
                                tabIndex={activeTab === key ? 0 : -1}
                                onClick={() => toggleActive(key)}
                                className={classNames({
                                    [tabClassNames.tabAction]: true,
                                    [tabClassNames.active]: activeTab === key,
                                    [styles.disabled]: isDisabled,
                                })}
                                disabled={isDisabled}
                            >
                                {title}
                            </button>
                        );
                    })}
                    <span ref={indicatorRef} className={styles.indicator} />
                </div>
                {isArrowVisible && showArrow && (
                    <div className={styles.chevron} data-tid='tab-arrow'>
                        <SvgChevronRight />
                    </div>
                )}
            </div>
            {tabs.map((tab, i) => (
                <Tab
                    key={tab.key}
                    isActive={activeTab === tab.key}
                    id={`tabpanel-${dataTid}-${i}`}
                    role='tabpanel'
                    aria-labelledby={`tab-${dataTid}-${i}`}
                    className={tabPanelClass}
                >
                    {tab.content}
                </Tab>
            ))}
        </div>
    );
}

export default Tabs;

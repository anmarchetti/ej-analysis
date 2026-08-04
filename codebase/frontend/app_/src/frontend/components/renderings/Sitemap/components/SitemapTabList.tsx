import React, { useRef } from 'react';
import classNames from 'classnames';

import { switchTabOnArrowPress } from 'frontend/utils/a11y.utils';
import { ISitemapSection } from 'frontend/components/renderings/Sitemap/SitemapBlock';

interface ISitemapTabListProps {
    activeTabIndex: number;
    items: ISitemapSection[];
    setActiveTabIndex: (index: number) => void;
}

const SitemapTabList = ({ items, activeTabIndex, setActiveTabIndex }: ISitemapTabListProps) => {
    const tabListRef = useRef<HTMLUListElement | null>(null);

    const onTabClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, tabIndex: number) => {
        event.preventDefault();
        setActiveTabIndex(tabIndex);
    };

    /** Move focus to prev/next tab on ArrowLeft/ArrowRight */
    const handleTabsKeyDown = (e: React.KeyboardEvent) => {
        const newIndex = switchTabOnArrowPress(e, activeTabIndex, items.length);

        if (newIndex !== undefined) {
            const tab = tabListRef.current?.querySelectorAll('.sitemap-tab')?.[newIndex] as HTMLButtonElement;
            !!tab && tab.focus();
            setActiveTabIndex(newIndex);
        }
    };

    return (
        <div className='sitemap-tab-list-wrap' onKeyDown={handleTabsKeyDown}>
            <ul className='sitemap-tab-list' role='tablist' ref={tabListRef}>
                {items.map((section, i) => (
                    <li key={section.SectionId} role='presentation'>
                        <button
                            className={classNames('sitemap-tab', activeTabIndex === i && 'sitemap-tab--active')}
                            role='tab'
                            aria-selected='true'
                            aria-controls={`sitemap-section-${section.SectionId}`}
                            id={`sitemap-tab-${section.SectionId}`}
                            type='button'
                            tabIndex={activeTabIndex === i ? 0 : -1}
                            onClick={e => onTabClick(e, i)}
                        >
                            {section.Title}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SitemapTabList;

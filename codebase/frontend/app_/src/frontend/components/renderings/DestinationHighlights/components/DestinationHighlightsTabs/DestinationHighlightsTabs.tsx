import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import { IDestinationHighlightTabItem } from 'models/data/IDestinationHighlightTabItem';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';

import styles from './DestinationHighlightsTabs.module.scss';

export interface IDestinationHighlightsTabsProps {
    setActiveTabId: (tabId: string) => void;
    tabs: IDestinationHighlightTabItem[];
    activeTabId?: string;
}

const DestinationHighlightsTabs: FC<IDestinationHighlightsTabsProps> = ({ tabs, activeTabId, setActiveTabId }) => {
    const onTabClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, tabId: string): void => {
        e.preventDefault();
        setActiveTabId(tabId);
    };

    return (
        <div className={styles.wrapper}>
            {tabs.map(tab => {
                const tabId = tab.id;
                const isTabActive = activeTabId === tab.id;

                return (
                    <button
                        key={tab.id}
                        className={classNames(styles.tab, {
                            [styles.activeTab]: isTabActive,
                        })}
                        aria-expanded={isTabActive}
                        aria-controls={`destination-highlights-tab-panel-${tabId}`}
                        onClick={(e): void => onTabClick(e, tab.id)}
                        data-tid='destination-highlights-tab'
                    >
                        {!!tab.fields?.Icon?.value?.src && (
                            <ImageWithFilter
                                imageSrc={cmsUrls.media(tab.fields.Icon.value.src)}
                                filterMatrix={isTabActive ? SVGFilterMatrix.Grayscale : SVGFilterMatrix.Orange}
                                className={styles.tabIcon}
                            />
                        )}
                        {!!tab.fields?.Title && <Text tag='' field={tab.fields.Title} />}
                    </button>
                );
            })}
        </div>
    );
};

export default DestinationHighlightsTabs;

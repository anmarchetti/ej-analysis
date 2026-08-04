import React, { FC, useRef } from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import { switchTabOnArrowPress } from 'frontend/utils/a11y.utils';
import { IFacilityGroup } from 'models/data/IHotel';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import styles from './FacilitiesTabsList.module.scss';

interface IFacilitiesTabsListProps {
    activeTabIndex: number;
    facilityGroups: IFacilityGroup[];
    setActiveTabIndex: (index: number) => void;
}

export const FacilitiesTabsList: FC<IFacilitiesTabsListProps> = ({
    facilityGroups,
    activeTabIndex,
    setActiveTabIndex,
}) => {
    const tabListRef = useRef<HTMLUListElement | null>(null);

    const onTabClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, tabIndex: number): void => {
        event.preventDefault();
        setActiveTabIndex(tabIndex);
    };

    /** Move focus to prev/next tab on ArrowUp/ArrowDown */
    const handleTabsKeyDown = (e: React.KeyboardEvent): void => {
        const newIndex = switchTabOnArrowPress(e, activeTabIndex, facilityGroups.length, true);

        if (newIndex !== undefined) {
            const tab = tabListRef.current?.querySelectorAll('button')?.[newIndex] as HTMLButtonElement;
            !!tab && tab.focus();
            setActiveTabIndex(newIndex);
        }
    };

    return (
        <ul
            className={styles.list}
            ref={tabListRef}
            role='tablist'
            aria-orientation='vertical'
            onKeyDown={handleTabsKeyDown}
        >
            {facilityGroups.map((group, i) => (
                <li key={group.id} role='presentation'>
                    <button
                        className={classNames(styles.tab, activeTabIndex === i && styles.active)}
                        role='tab'
                        aria-selected={activeTabIndex === i}
                        aria-controls={`tabpanel-${group.id}`}
                        id={`tab-${group.id}`}
                        type='button'
                        tabIndex={activeTabIndex === i ? 0 : -1}
                        onClick={(e): void => onTabClick(e, i)}
                    >
                        {!!group.iconUrl && (
                            <span
                                className={classNames(styles.icon, 'icon--bg-image')}
                                style={{ backgroundImage: `url(${cmsUrls.media(group.iconUrl)})` }}
                            />
                        )}
                        <span className='me-2'>{group.name}</span>
                        <SvgChevronRight className={styles.arrow} />
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default FacilitiesTabsList;

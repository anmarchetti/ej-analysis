import { ReactElement } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';

import useNavigationTabsPreparedData, { INavigationTab } from './NavigationTabs.utils';

import styles from './NavigationTabs.module.scss';

interface INavigationTabsProps {
    list: INavigationTab[];
}

function NavigationTabs(props: INavigationTabsProps): ReactElement {
    const {
        wrapperRef,
        list,
        active,
        onClick,
        onOpen,
        onClose,
        isMobileActiveItemDisplayed,
        isMobileCollapseItemDisplayed,
        isListDisplayed,
        wrapperClassNames,
        linksClassNames,
    } = useNavigationTabsPreparedData(props);

    return (
        <div className={wrapperClassNames} ref={wrapperRef} data-tid='navigation-tabs-wrapper'>
            <ul className={linksClassNames}>
                {isMobileActiveItemDisplayed && (
                    <li
                        className={classNames(styles.item, styles.first, styles.active)}
                        onClick={onOpen}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                onOpen();
                            }
                        }}
                        data-tid='mobile-active-item'
                    >
                        <div className={styles.content}>
                            <span className={styles.icon}>
                                <img alt='icon-img' {...active?.fields?.Icon.value} />
                            </span>
                            <p className={styles.title}>{active?.fields?.Name?.value}</p>
                        </div>

                        <div className={styles.chevron}>
                            <SvgChevronDown />
                        </div>
                    </li>
                )}

                {isListDisplayed &&
                    list.map(({ id, fields: { Id, Icon, Name } }: INavigationTab) => (
                        <li
                            key={id}
                            className={classNames(styles.item, {
                                [styles.active]: active?.fields?.Id?.value === Id.value,
                            })}
                            onClick={e => {
                                e.preventDefault();

                                onClick(Id.value);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    onClick(Id.value);
                                }
                            }}
                            data-tid='navigation-tab'
                        >
                            <div className={styles.content}>
                                <span className={styles.icon}>
                                    <img alt='icon-img' {...Icon.value} />
                                </span>

                                <p className={styles.title}>{Name.value}</p>
                            </div>
                        </li>
                    ))}

                {isMobileCollapseItemDisplayed && (
                    <li
                        className={classNames(styles.item, styles.close)}
                        onClick={onClose}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                onClose();
                            }
                        }}
                        data-tid='mobile-close-item'
                    >
                        <SvgChevronUp />
                    </li>
                )}
            </ul>
        </div>
    );
}

export default observer(NavigationTabs);

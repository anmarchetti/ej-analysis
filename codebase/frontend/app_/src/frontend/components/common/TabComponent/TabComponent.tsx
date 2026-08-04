import React, { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { purifyUrl } from 'frontend/utils/url.utils';
import { ICompressedSitecoreLink, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ComponentWithAnimatedHeight from 'frontend/components/common/ComponentWithAnimatedHeight/ComponentWithAnimatedHeight';
import Link from 'frontend/components/common/Link';

import styles from './TabComponent.module.scss';

export interface ITab {
    Links: ICompressedSitecoreLink[];
    Title: ISitecoreField<string>;
}

export interface ITabComponent {
    data: ITab[];
}

interface ISliderSettings {
    leftPosition: number;
    width: number;
}

interface ITabData {
    items: (ICompressedSitecoreLink[] | never[])[];
    titles: ISitecoreField<string>[];
}

const TabComponent: FC<ITabComponent> = ({ data }) => {
    const [activeTabIndex, setActiveTabIndex] = useState<Nullable<number>>(null);
    const [sliderSettings, setSliderSettings] = useState<ISliderSettings>();

    const { titles, items } = data.reduce(
        (acc: ITabData, item: ITab) => {
            acc.titles.push(item.Title);
            acc.items.push(item.Links);

            return acc;
        },
        { titles: [], items: [] },
    );

    const buttonClickHandler = (event: React.MouseEvent<HTMLButtonElement>, index: number): void => {
        setSliderSettings({
            leftPosition: (event.target as HTMLButtonElement).offsetLeft,
            width: (event.target as HTMLButtonElement).offsetWidth,
        });
        setActiveTabIndex(index);
    };

    const isFirstRendering = activeTabIndex === null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                {titles.map((title, index) => (
                    <button
                        key={title.value}
                        className={classNames(
                            styles.button,
                            activeTabIndex === index && styles.activeButton,
                            isFirstRendering && index === 0 && styles.activeFirstTab,
                        )}
                        onClick={(e): void => buttonClickHandler(e, index)}
                        data-tid='tab-title'
                    >
                        <Text field={title} />
                    </button>
                ))}
                <div
                    className={styles.slider}
                    style={{ left: sliderSettings?.leftPosition, width: sliderSettings?.width }}
                    data-tid='slider'
                />
            </div>

            <ComponentWithAnimatedHeight>
                {items.map((item, index) => {
                    const isActiveList = (isFirstRendering && index === 0) || activeTabIndex === index;
                    const itemElement = item[0] as ICompressedSitecoreLink | undefined;

                    return (
                        <div
                            key={`${itemElement?.Id}_${index}`}
                            className={classNames(styles.list, isActiveList && styles.activeList)}
                            data-tid={`${index}-list`}
                        >
                            {item.map(link => {
                                if (!link.Url || !link.Name) {
                                    return null;
                                }

                                return (
                                    <Link href={purifyUrl(link.Url)} key={link.Id}>
                                        {link.Name}
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </ComponentWithAnimatedHeight>
        </div>
    );
};

export default TabComponent;

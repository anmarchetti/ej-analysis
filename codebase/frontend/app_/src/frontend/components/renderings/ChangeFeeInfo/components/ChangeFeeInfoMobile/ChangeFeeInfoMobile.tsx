import { FC, useEffect, useRef, useState } from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useClickOutside from 'frontend/hooks/useClickOutside';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import { IChangeFeeInfoProps } from 'frontend/components/renderings/ChangeFeeInfo/ChangeFeeInfo';

import styles from './ChangeFeeInfoMobile.module.scss';

const FILTERS_HEIGHT = 49;

const ChangeFeeInfoMobile: FC<IChangeFeeInfoProps> = ({ fields, descriptionText }) => {
    const { getPhrase, areFiltersSelected, isAmendHotelPage } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        areFiltersSelected: stores.amendHotelStore.filters.areFiltersSelected,
        isAmendHotelPage: stores.layoutStore.isAmendHotelPage,
    }));

    const [isStuck, setIsStuck] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const expandItemRef = useRef<HTMLDivElement>(null);
    const shouldStickUnderFilters = isAmendHotelPage && areFiltersSelected;
    const topPosition = shouldStickUnderFilters ? FILTERS_HEIGHT : 0;

    const onExpand = (value: boolean): void => {
        setIsExpanded(value);
    };

    useClickOutside(expandItemRef, () => {
        if (!isStuck) return;

        onExpand(false);
    });

    useEffect(() => {
        const body = document.body;
        const drawerNode = document.querySelector('.drawer.drawer--open') as HTMLElement;

        if (isStuck && isExpanded) {
            body.style.overflow = 'hidden';

            // In case banner is inside a drawer, need to lock drawer scroll
            if (drawerNode) {
                drawerNode.style.overflow = 'hidden';
            }
        }

        return () => {
            body.style.overflow = '';

            if (drawerNode) {
                drawerNode.style.overflow = '';
            }
        };
    }, [isStuck, isExpanded]);

    useEffect(() => {
        const ref = containerRef?.current;

        if (!ref) return;

        const observer = new IntersectionObserver(
            ([e]) => {
                const isAtTop = e.boundingClientRect.top <= topPosition;
                setIsStuck(isAtTop && e.intersectionRatio < 1);
                setIsExpanded(false);
            },
            { rootMargin: `-${topPosition}px 0px 0px 0px`, threshold: [1] },
        );
        observer.observe(ref);

        return () => {
            observer.unobserve(ref);
        };
    }, [isAmendHotelPage, topPosition]);

    if (!fields) return null;

    const { Title, Icon } = fields;

    const containerClass = classNames(styles.container, {
        [styles.stuck]: isStuck,
        stuck: isStuck,
        [styles.hasBackgroud]: isStuck && isExpanded,
        [styles.shouldStickUnderFilters]: shouldStickUnderFilters,
    });

    return (
        <div
            ref={containerRef}
            data-tid='change-fee-info-container-mobile'
            className={classNames(containerClass, 'fee-banner-mobile')}
        >
            <ExpandableItem
                className={classNames(styles.expandableItem, styles.expandableItemContainer)}
                titleWrapperClassName={styles.expandableTitle}
                contentClassName={styles.expandableContent}
                expandArrowClassName={styles.expandableArrow}
                iconClassName={styles.expandableIcon}
                title={Title.value}
                icon={<JSSImageNext field={Icon} fill mediaSize={MediaSize.Small} />}
                isOpened={isExpanded}
                onOpen={onExpand}
                containerRef={expandItemRef}
            >
                <RichText field={{ value: descriptionText }} tag='span' className={styles.content} />

                {isStuck && (
                    <Button data-tid='change-fee-info-close-mobile' onClick={(): void => onExpand(false)} isTransparent>
                        {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                    </Button>
                )}
            </ExpandableItem>
        </div>
    );
};

export default observer(ChangeFeeInfoMobile);

import { useMemo } from 'react';
import classNames from 'classnames';

import { useAnchorScrollTracker } from 'frontend/hooks/useAnchorScrollTracker';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RouterLink from 'frontend/components/common/RouterLink';

import Anchor, { TAnchorFields } from './Anchor';

import styles from './Anchors.module.scss';

export type TAnchorsProps = {
    items: ISitecoreChildren<TAnchorFields>[] | undefined;
    isSticky?: boolean;
    link?: ISitecoreField<ISitecoreLink>;
    reviews?: number;
};

const OFFSET_SIZE = 70;

export enum OffsetFromElementClassName {
    ANCHORS = 'anchors-wrapper',
    BASKET = 'basket',
}

export const Anchors: React.FC<TAnchorsProps> = ({ items = [], link, reviews, isSticky }) => {
    const allAnchors = useMemo(() => items.filter(e => !!e.fields?.Anchor?.value), [items]);
    const anchorTrackerItems = useMemo(() => allAnchors.map(item => ({ id: item.fields.Anchor.value })), [allAnchors]);
    const hasAnchors = allAnchors.length > 0;

    const anchorsStates = useAnchorScrollTracker({
        items: anchorTrackerItems,
        baseOffset: OFFSET_SIZE,
        keepTabSelection: true,
    });

    if (!hasAnchors && !link) return null;

    const extraOffsetFromElementClass = isSticky
        ? OffsetFromElementClassName.ANCHORS
        : OffsetFromElementClassName.BASKET;

    const onAnchorClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, newTab: string): void => {
        e.preventDefault();

        const element = document.getElementById(newTab);

        if (element) {
            let offsetTop = 0;
            const [offsetElement] = document.getElementsByClassName(extraOffsetFromElementClass);

            if (offsetElement) {
                offsetTop = (offsetElement as HTMLElement).offsetHeight;
            }

            scrollToElement(element, offsetTop);
        }
    };

    const wrapperClassName = classNames('anchors-wrapper', isSticky ? styles.sticky : 'd-none d-md-block');
    const activeAnchorId = anchorsStates.find(item => item.isActive)?.id;

    return (
        <div className={wrapperClassName}>
            <div className='wrapper-container wrapper-container--px'>
                {hasAnchors && (
                    <div className='anchors-box' data-tid='anchor-links-box'>
                        {allAnchors.map(({ fields }, idx) => (
                            <Anchor
                                key={idx}
                                fields={fields}
                                isActive={activeAnchorId === fields.Anchor.value}
                                onClick={(e): void => onAnchorClick(e, fields.Anchor.value)}
                                reviews={reviews}
                            />
                        ))}
                    </div>
                )}
                {link && (
                    <RouterLink link={link} className={classNames('btn', styles.button)} dataId='tabs-link-button'>
                        {link.value?.text}
                    </RouterLink>
                )}
            </div>
        </div>
    );
};

export default Anchors;

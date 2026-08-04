import { FC, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';

import styles from './LogoCarouselContentCard.module.scss';

export interface ILogoCarouselContentCardProps {
    description: ISitecoreField<string>;
    title: ISitecoreField<string>;
    activeIdx?: number;
    isActive?: boolean;
    isExpandable?: boolean;
    readLessButtonText?: ISitecoreField<string>;
    readMoreButtonText?: ISitecoreField<string>;
}

export const COLLAPSED_CONTAINER_HEIGHT = 260;
export const MAX_CONTENT_HEIGHT = 160;

const LogoCarouselContentCard: FC<ILogoCarouselContentCardProps> = ({
    title,
    description,
    isExpandable,
    readLessButtonText,
    readMoreButtonText,
    activeIdx,
    isActive,
}) => {
    const contentWrapperRef = useRef<null | HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isHeightOverSize, setIsHeightOverSize] = useState<boolean>(true);

    useEffect(() => {
        if (!isExpandable) {
            return;
        }

        setIsExpanded(false);

        const contentHeight = contentWrapperRef?.current?.scrollHeight ?? 0;

        setIsHeightOverSize(contentHeight > MAX_CONTENT_HEIGHT);
    }, [contentWrapperRef, isExpandable, activeIdx]);

    const expandableContainerStyles = {
        maxHeight: isHeightOverSize && !isExpanded ? COLLAPSED_CONTAINER_HEIGHT : 'unset',
        minHeight: COLLAPSED_CONTAINER_HEIGHT,
    };

    const hasButtonText = !!readMoreButtonText?.value && !!readLessButtonText?.value;

    return (
        <div
            className={classNames(styles.container, {
                [styles.hidden]: !isActive,
            })}
            {...(isExpandable && { style: expandableContainerStyles })}
            data-tid='logo-carousel-content-card'
        >
            <div
                className={classNames(styles.contentWrapper, {
                    [styles.contentWrapperSpoiler]: isExpandable && isHeightOverSize && !isExpanded,
                })}
                ref={contentWrapperRef}
            >
                <Text field={title} tag='h3' className={styles.title} data-tid='logo-carousel-card-title' />
                {!!description?.value && (
                    <RichTextWithLinks
                        field={description}
                        className={styles.description}
                        dataId='logo-carousel-card-description'
                    />
                )}
            </div>

            {isHeightOverSize && hasButtonText && (
                <div className={styles.showContentBtn}>
                    <ShowMoreButton
                        isChevronUp={isExpanded}
                        title={isExpanded ? readLessButtonText.value : readMoreButtonText.value}
                        dataTid='logo-carousel-card-read-more-btn'
                        onClick={() => setIsExpanded(!isExpanded)}
                    />
                </div>
            )}
        </div>
    );
};

export default LogoCarouselContentCard;

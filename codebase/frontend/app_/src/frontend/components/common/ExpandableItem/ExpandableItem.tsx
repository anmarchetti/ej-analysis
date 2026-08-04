import React, { FunctionComponent, useEffect, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import styles from './ExpandableItem.module.scss';

const ANIMATION_TIMEOUT = 500;

export interface IExpandableItemProps {
    children?: React.ReactNode;
    className?: string;
    containerRef?: React.RefObject<HTMLDivElement>;
    contentClassName?: string;
    dataTid?: string;
    expandArrowClassName?: string;
    expandButtonChildren?: React.ReactNode;
    expandButtonClassName?: string;
    icon?: React.ReactNode;
    iconClassName?: string;
    id?: string;
    isDisabled?: boolean;
    isFinalStep?: boolean;
    isLoading?: boolean;
    isOpened?: boolean;
    isShadowy?: boolean;
    onOpen?: (isOpened: boolean) => void;
    title?: string;
    titleClassName?: string;
    titleWrapperClassName?: string;
}

const ExpandableItem: FunctionComponent<IExpandableItemProps> = ({
    title,
    icon,
    children,
    isDisabled,
    isOpened: isOpenedByParent,
    onOpen,
    className,
    contentClassName,
    iconClassName,
    titleClassName,
    titleWrapperClassName,
    id,
    expandArrowClassName,
    isShadowy,
    dataTid = 'expand-item',
    containerRef,
    isLoading,
    expandButtonChildren,
    expandButtonClassName,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [isOpened, setOpened] = useState(isOpenedByParent);

    const labels = {
        closeLabel: getPhrase(SitecoreDictionary.GlobalsButtonsClose),
        openLabel: getPhrase(SitecoreDictionary.GlobalsButtonsExpand),
    };

    const toggleOpen = (): void => {
        if (isDisabled) {
            return;
        }

        // State can be controlled by parent or be controlled by itself
        if (onOpen) {
            onOpen(!isOpened);

            return;
        }

        setOpened(!isOpened);
    };

    useEffect(() => {
        setOpened(isOpenedByParent);
    }, [isOpenedByParent]);

    if (isLoading) {
        return (
            <div
                data-tid={`${dataTid}-shimmer`}
                id={id}
                className={classNames(styles.container, 'expand-item', className, {
                    [styles.shadowy]: isShadowy,
                })}
            >
                <div className={classNames(styles.shimmer, 'placeholder-shimmer')} data-tid='expandable-item-shimmer' />
            </div>
        );
    }

    const ariaLabel = isOpened ? labels.closeLabel : labels.openLabel;
    const ariaLabelProps = !isDisabled ? { 'aria-label': ariaLabel } : {};

    return (
        <div
            data-tid={dataTid}
            id={id}
            className={classNames(styles.container, 'expand-item', className, {
                [styles.disabled]: isDisabled,
                [styles.shadowy]: isShadowy,
                [styles.opened]: isOpened,
            })}
            data-expanded={isOpened}
            ref={containerRef}
        >
            <button
                className={classNames(styles.meta, expandButtonClassName)}
                tabIndex={0}
                onClick={toggleOpen}
                disabled={isDisabled}
                data-tid='expand-button'
                {...ariaLabelProps}
            >
                <div className={classNames(styles.title, titleWrapperClassName)}>
                    {!!icon && (
                        <span className={classNames(styles.icon, iconClassName)} data-tid='expand-item-icon'>
                            {icon}
                        </span>
                    )}
                    {title && (
                        <h3 className={classNames(styles.titleText, titleClassName)} data-tid='expand-item-title'>
                            {title}
                        </h3>
                    )}
                    {expandButtonChildren}
                </div>
                {!!children && (
                    <div className={classNames(styles.chevron, expandArrowClassName)} data-tid='expand-arrow'>
                        <SvgChevronRight />
                    </div>
                )}
            </button>
            <HeightAnimatedContainer
                isOpened={isOpened}
                timeout={ANIMATION_TIMEOUT}
                containerClasName={styles.animatedContainer}
            >
                <div data-tid={dataTid + '-content'} className={contentClassName}>
                    {children}
                </div>
            </HeightAnimatedContainer>
        </div>
    );
};

export default ExpandableItem;

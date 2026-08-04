import { FC, ReactNode } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';

import styles from './ItineraryItem.module.scss';

export type TItineraryItemProps = {
    children: ReactNode;
    icon: ReactNode;
    isExpanded: boolean;
    setExpanded: () => void;
    title: ISitecoreField<string>;
    canExpand?: boolean;
    className?: string;
    hideSeparator?: boolean;
    isGreyedOut?: boolean;
    itemClassName?: string;
};

const ItineraryItem: FC<TItineraryItemProps> = ({
    title,
    icon,
    children,
    hideSeparator,
    className,
    isExpanded,
    setExpanded,
    isGreyedOut,
    canExpand = true,
    itemClassName,
}) => (
    <div
        data-tid='itinerary-item'
        className={classNames(styles.container, className, { [styles.greyedOut]: isGreyedOut })}
    >
        <span className={styles.icon} data-tid='itinerary-item-icon'>
            {icon}
        </span>
        <div className={classNames(styles.itemWithButton, itemClassName)}>
            <Text field={title} className={styles.headerTitle} tag='h4' data-tid='itinerary-item-title' />
            {(isExpanded || !isGreyedOut) && <div className={styles.itemContent}>{children}</div>}
            {canExpand && (
                <Button
                    isText
                    className={styles.expandButton}
                    data-tid='itinerary-item-expand-button'
                    onClick={setExpanded}
                >
                    <SvgChevronDown className={classNames(styles.chevron, { [styles.expanded]: isExpanded })} />
                </Button>
            )}
        </div>
        <div
            data-tid='itinerary-item-separator'
            className={classNames(styles.verticalSeparator, { [styles.hidden]: hideSeparator })}
        />
    </div>
);

export default ItineraryItem;

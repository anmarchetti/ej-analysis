import React, { FunctionComponent } from 'react';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import ExpandableItem, { IExpandableItemProps } from 'frontend/components/common/ExpandableItem/ExpandableItem';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './AmendSummaryAccordion.module.scss';

export interface IAmendSummaryAccordionProps extends Omit<IExpandableItemProps, 'icon'> {
    children: React.ReactNode;
    icon: ISitecoreField<ISitecoreImage>;
    title: string;
    className?: string;
    expanderClassName?: string;
}

const AmendSummaryAccordion: FunctionComponent<IAmendSummaryAccordionProps> = ({
    icon,
    title,
    children,
    className,
    expanderClassName,
    ...rest
}) => {
    if (!children) {
        return null;
    }

    return (
        <ExpandableItem
            icon={<JSSImage field={icon} />}
            title={title}
            className={classNames(styles.expander, expanderClassName)}
            titleWrapperClassName={styles.titleContent}
            titleClassName={styles.title}
            iconClassName={styles.icon}
            isOpened
            isShadowy
            {...rest}
        >
            <div className={classNames(styles.children, className)}>{children}</div>
        </ExpandableItem>
    );
};

export default AmendSummaryAccordion;

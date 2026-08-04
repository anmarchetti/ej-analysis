import React from 'react';
import classNames from 'classnames';

import BellRinging from 'frontend/components/icons-new/BellRinging';

import styles from './amendPayNowHeader.module.scss';

export interface IAmendPayNowHeaderProps {
    description: React.ReactNode;
    title: string;
    className?: string;
    wide?: boolean;
    withIcon?: boolean;
}

function AmendPayNowHeader({ title, description, withIcon, wide, className }: IAmendPayNowHeaderProps) {
    return (
        <div
            className={classNames(styles.content, className, {
                [styles.wide]: wide,
            })}
            data-tid='amend-pay-now-header'
        >
            <div className={styles.header}>
                {withIcon && <BellRinging />}
                <h2>{title}</h2>
            </div>
            <p className={styles.description}>{description}</p>
        </div>
    );
}

export default AmendPayNowHeader;

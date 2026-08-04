import React from 'react';
import classNames from 'classnames';

import styles from './tab.module.scss';

interface ITabProps extends Record<string, any> {
    children: React.ReactNode;
    className?: string;
    isActive?: boolean;
}

function Tab({ children, isActive, className, ...tabProps }: ITabProps) {
    return (
        <div
            {...tabProps}
            className={classNames(
                {
                    [styles.tab]: true,
                    ['d-none']: !isActive,
                },
                className,
            )}
        >
            {children}
        </div>
    );
}

export default Tab;

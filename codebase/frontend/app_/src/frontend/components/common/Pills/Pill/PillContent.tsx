import { FC } from 'react';
import classNames from 'classnames';

import styles from './Pill.module.scss';

interface IPillContentProps {
    dotted: boolean;
    ellipsis: boolean;
    contentClass?: string;
    dataTid?: string;
    icon?: JSX.Element;
    iconClass?: string;
    title?: string;
    titleClass?: string;
}

const PillContent: FC<IPillContentProps> = ({
    contentClass,
    iconClass,
    titleClass,
    title,
    icon,
    dotted,
    ellipsis,
    dataTid,
}) => (
    <div className={classNames(styles.content, contentClass)} data-tid={dataTid}>
        {icon && (
            <div className={classNames(styles.iconWrapper, iconClass)} data-tid='pill-icon'>
                {icon}
            </div>
        )}

        <p
            className={classNames(styles.titleWrapper, titleClass, {
                [styles.dotted]: dotted,
                [styles.ellipsis]: ellipsis,
            })}
            data-tid='pill-title'
        >
            {title}
        </p>
    </div>
);

export default PillContent;

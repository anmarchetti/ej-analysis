import { FC, SVGProps } from 'react';
import classNames from 'classnames';

import styles from './HeaderTextWithIcon.module.scss';

export interface IHeaderTextWithIconProps {
    Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
    title: string;
    titleClassName?: string;
}

const HeaderTextWithIcon: FC<IHeaderTextWithIconProps> = ({ Icon, title, titleClassName }) => (
    <div className={styles.titleRow}>
        <div className={styles.iconWrapper}>
            <Icon className={styles.titleIcon} />
        </div>
        <h2 className={classNames(styles.title, titleClassName)}>{title}</h2>
    </div>
);

export default HeaderTextWithIcon;

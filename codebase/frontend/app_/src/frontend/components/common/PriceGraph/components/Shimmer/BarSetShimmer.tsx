import classNames from 'classnames';

import styles from './PriceGraphShimmer.module.scss';

interface IBarSetProps {
    className?: string;
}

export const BarSetShimmer = ({ className }: IBarSetProps) => (
    <div className={classNames(styles.bars, className)}>
        <div className={classNames(styles.bar, 'placeholder-shimmer')} />
        <div className={classNames(styles.bar, 'placeholder-shimmer')} />
        <div className={classNames(styles.bar, 'placeholder-shimmer')} />
    </div>
);

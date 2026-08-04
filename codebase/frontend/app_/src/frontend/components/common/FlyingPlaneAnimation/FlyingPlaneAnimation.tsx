import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SiteSettings from 'models/enum/SiteSettings';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './FlyingPlaneAnimation.module.scss';

interface IFlyingPlaneAnimationFields {
    className?: string;
}

const FlyingPlaneAnimation = ({ className }: IFlyingPlaneAnimationFields) => {
    const { getSetting } = useStore(stores => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const iconSource = getSetting(SiteSettings.LoaderAnimationIcon);

    if (!iconSource) {
        return null;
    }

    return (
        <div className={`${styles.animationContainer} ${className}`} data-tid='animation-container'>
            <JSSImage
                field={{ value: { src: iconSource } }}
                className={styles.planeIcon}
                data-tid='plane-animation-icon'
            />
            <div className={styles.dots}>
                <div className={classNames(styles.dot, styles.dot_1)} />
                <div className={classNames(styles.dot, styles.dot_2)} />
                <div className={classNames(styles.dot, styles.dot_3)} />
                <div className={classNames(styles.dot, styles.dot_4)} />
                <div className={classNames(styles.dot, styles.dot_5)} />
            </div>
        </div>
    );
};

export default FlyingPlaneAnimation;

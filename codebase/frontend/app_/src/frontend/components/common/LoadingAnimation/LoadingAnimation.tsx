import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SiteSettings from 'models/enum/SiteSettings';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './LoadingAnimation.module.scss';

interface ILoadingAnimationFields {
    className?: string;
    isCentered?: boolean;
}

const LoadingAnimation: FC<ILoadingAnimationFields> = ({ className = '', isCentered = false }) => {
    const { getSetting } = useStore(stores => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const iconSource = getSetting(SiteSettings.LoaderAnimationIcon);

    if (!iconSource) {
        return null;
    }

    return (
        <div
            className={classNames({
                [styles.animationContainer]: true,
                [styles.centered]: isCentered,
                [className]: !!className,
            })}
            data-tid='loading-animation-container'
        >
            <JSSImage
                field={{ value: { src: iconSource } }}
                className={styles.planeIcon}
                data-tid='loading-animation-icon'
            />
        </div>
    );
};

export default LoadingAnimation;

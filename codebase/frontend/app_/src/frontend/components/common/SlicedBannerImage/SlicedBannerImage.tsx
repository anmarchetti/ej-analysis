import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSResponsiveImage from 'frontend/components/common/JSSResponsiveImage';

import styles from './SlicedBannerImage.module.scss';

export interface ISlicedBannerImageProps {
    image: ISitecoreField<ISitecoreImage>;
    className?: string;
    isBottomSlice?: boolean;
    isGray?: boolean;
    isOverlaid?: boolean;
    isSemiTransparent?: boolean;
    isSliceDirectionRight?: boolean;
}

const SlicedBannerImage = ({
    image,
    className,
    isGray,
    isOverlaid,
    isSemiTransparent,
    isSliceDirectionRight,
    isBottomSlice,
}: ISlicedBannerImageProps) => {
    const containerClassName = classNames(styles.container, className, {
        [styles.bottomGradient]: !isBottomSlice,
    });

    const overlayClassName = classNames(styles.overlay, {
        [styles.semiTransparent]: isSemiTransparent,
        [styles.gray]: isGray || !image?.value.src,
        [styles.withOverlay]: isOverlaid,
    });

    return (
        <div
            className={containerClassName}
            data-tid={isSliceDirectionRight ? 'sliced-banner-image-cut-right' : 'sliced-banner-image-cut-left'}
        >
            <div className={overlayClassName} />
            {image?.value.src && (
                <JSSResponsiveImage
                    field={image}
                    className={styles.image}
                    role='presentation'
                    data-tid='sliced-banner-image'
                />
            )}
            <div
                className={classNames(styles.cutPlane, {
                    [styles.cutPlaneRight]: isSliceDirectionRight,
                    [styles.cutPlaneBottom]: isBottomSlice,
                })}
            />
        </div>
    );
};

export default SlicedBannerImage;

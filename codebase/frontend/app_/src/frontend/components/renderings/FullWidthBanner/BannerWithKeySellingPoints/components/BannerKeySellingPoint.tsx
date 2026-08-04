import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IBannerKeySellingPoint } from 'models/data/IFullWithBanner';
import { MediaSize } from 'models/data/MediaSizeParams';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';

import styles from './BannerKeySellingPoint.module.scss';

const ICON_SIZE = 24;

export interface IBannerKeySellingPointProps extends IBannerKeySellingPoint {
    className?: string;
}

const BannerKeySellingPoint: FC<IBannerKeySellingPointProps> = ({ Icon, Label, className }) => (
    <div data-tid='banner-key-selling-point-item' className={classNames(styles.wrapper, className)}>
        <JSSImageNext
            field={Icon}
            mediaSize={MediaSize.Small}
            width={Icon?.value?.width ?? ICON_SIZE}
            height={Icon?.value?.height ?? ICON_SIZE}
            data-tid='banner-key-selling-point-icon'
            className={styles.icon}
        />
        <Text field={Label} tag='p' data-tid='banner-key-selling-point-label' className={styles.label} />
    </div>
);

export default BannerKeySellingPoint;

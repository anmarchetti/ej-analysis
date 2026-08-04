import { forwardRef } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import {
    getMobileAndDesktopFontSizeClassName,
    getTitleFontClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { IFullWidthBannerFields, IFullWidthBannerParameters, TextAlignmentVariant } from 'models/data/IFullWithBanner';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import LuxuryBadge from 'frontend/components/common/LuxuryBadge/LuxuryBadge';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import FullWidthBannerButton from 'frontend/components/renderings/FullWidthBanner/components/FullWidthBannerButton/FullWidthBannerButton';
import FullWidthBannerPill from 'frontend/components/renderings/FullWidthBanner/components/FullWidthBannerPill/FullWidthBannerPill';

import BannerKeySellingPoint from './components/BannerKeySellingPoint';

import styles from './BannerWithKeySellingPoints.module.scss';

export interface IBannerWithKeySellingPointsProps {
    fields: IFullWidthBannerFields;
    params: IFullWidthBannerParameters;
}

const BannerWithKeySellingPoints = forwardRef<HTMLDivElement, IBannerWithKeySellingPointsProps>(
    ({ fields, params }, ref) => {
        const { Title, Description, Image, KeySellingPoints, PillText, IsLuxuryBadge } = fields;

        if (!Title?.value && !KeySellingPoints?.fields?.Items?.length) {
            return null;
        }

        const { PillColour, TextAlignment, TitleFontSize, TitleFontStyle, CTATheme } = params;

        const isRightAligned = TextAlignment === TextAlignmentVariant.Right;
        const titleFontSizeClassName = getMobileAndDesktopFontSizeClassName(TitleFontSize);
        const titleFontClassName = getTitleFontClassName(TitleFontStyle);

        return (
            <div ref={ref} data-tid='full-width-banner-with-key-selling-points' className={styles.wrapper}>
                <div
                    data-tid='banner-with-key-selling-points-info-wrapper'
                    className={classNames(styles.infoWrapper, {
                        [styles.rightAligned]: isRightAligned,
                    })}
                >
                    <FullWidthBannerPill PillText={PillText} PillColour={PillColour} className={styles.pill} />
                    <Text
                        field={Title}
                        tag='h2'
                        data-tid='banner-with-key-selling-points-title'
                        className={classNames(styles.title, titleFontSizeClassName, titleFontClassName)}
                    />

                    <RichTextWithLinks
                        field={Description}
                        className={styles.description}
                        dataId='banner-with-key-selling-points-description'
                    />

                    <div data-tid='key-selling-points-wrapper' className={styles.keySellingPoints}>
                        {KeySellingPoints?.fields?.Items?.map(point => {
                            const { Icon, Label } = point.fields;

                            return (
                                <BannerKeySellingPoint
                                    Icon={Icon}
                                    Label={Label}
                                    key={`key-selling-point-${point.id}`}
                                    className={styles.item}
                                />
                            );
                        })}
                    </div>

                    <FullWidthBannerButton fields={fields} CTATheme={CTATheme} />
                </div>
                <div data-tid='banner-with-key-selling-points-image-wrapper' className={styles.imageWrapper}>
                    <JSSImageNext field={Image} className={styles.image} />
                    {IsLuxuryBadge.value && <LuxuryBadge wrapperClassName={styles.badge} />}
                </div>
            </div>
        );
    },
);

export default BannerWithKeySellingPoints;

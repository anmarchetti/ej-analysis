import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import {
    getMobileAndDesktopFontSizeClassName,
    getTitleFontClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { TFullWidthBannerProps } from 'models/data/IFullWithBanner';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import FullWidthBannerButton from 'frontend/components/renderings/FullWidthBanner/components/FullWidthBannerButton/FullWidthBannerButton';
import FullWidthBannerPill from 'frontend/components/renderings/FullWidthBanner/components/FullWidthBannerPill/FullWidthBannerPill';
import styles from 'frontend/components/renderings/FullWidthBanner/FullWidthBanner.module.scss';

export const FullWidthBannerInfo: FC<TFullWidthBannerProps> = ({ fields, params }) => {
    if (!fields) {
        return null;
    }

    const { Title, Description, PillText } = fields;
    const { CTATheme, TitleFontSize, PillColour, TitleFontStyle } = params;

    const titleFontSizeClassName = getMobileAndDesktopFontSizeClassName(TitleFontSize);
    const titleFontClassName = getTitleFontClassName(TitleFontStyle);

    return (
        <>
            <FullWidthBannerPill PillText={PillText} PillColour={PillColour} className={styles.pill} />
            <Text
                data-tid='banner-title'
                className={classNames(styles.title, titleFontSizeClassName, titleFontClassName)}
                field={Title}
                tag='h2'
            />
            {Description.value && (
                <RichTextWithLinks
                    dataId='banner-description'
                    field={Description}
                    className={classNames(styles.description)}
                />
            )}
            <FullWidthBannerButton fields={fields} CTATheme={CTATheme} />
        </>
    );
};

import React, { FunctionComponent, useEffect, useState } from 'react';
import classNames from 'classnames';

import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import ConditionalWrapper from 'frontend/components/common/ConditionalWrapper/ConditionalWrapper';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

export interface ILogoImageProps {
    isStandardTheme: boolean;
    image?: ISitecoreField<ISitecoreImage>;
    isBgTransparent?: boolean;
    shouldWrap?: boolean;
}

export const LOGO_MAX_WIDTH = 110;

export const LogoImage: FunctionComponent<ILogoImageProps> = ({
    image,
    isBgTransparent,
    shouldWrap,
    isStandardTheme,
}) => {
    const [styles, setStyles] = useState<TStyles | null>(null);

    useEffect(() => {
        let isMounted = true;

        if (isStandardTheme) {
            import('./LogoImageV1.module.scss').then(module => {
                if (isMounted) setStyles(module.default);
            });
        } else {
            import('./LogoImageV2.module.scss').then(module => {
                if (isMounted) setStyles(module.default);
            });
        }

        return () => {
            isMounted = false;
        };
    }, [isStandardTheme]);

    if (!image?.value?.src || !styles) {
        return null;
    }

    const sizes = {
        width: image.value.width ?? 1,
        height: image.value.height ?? 1,
    };

    // if image size is larger than container max width (according to styles)
    // then set image sizes to max width of the container to make Next.js load only images sizes that do not exceed container
    // as content editors can add 1920 width image for logo
    if (sizes.width > LOGO_MAX_WIDTH) {
        const sizeRatio = sizes.height / sizes.width;
        sizes.width = LOGO_MAX_WIDTH;
        sizes.height = Math.round(LOGO_MAX_WIDTH * sizeRatio);
    }

    return (
        <ConditionalWrapper
            condition={!!shouldWrap}
            wrapper={(children: JSX.Element) => <ComponentWrapper>{children}</ComponentWrapper>}
        >
            <div
                className={classNames(styles.logoContainer, isBgTransparent && styles.logoTransparent)}
                data-tid='partnership-logo'
            >
                <JSSImageNext field={image} className={styles.logo} mediaSize={MediaSize.Small} {...sizes} />
            </div>
        </ConditionalWrapper>
    );
};

export default LogoImage;

import { FunctionComponent, memo, useMemo } from 'react';
import { Image as SitecoreJSSImage } from '@sitecore-jss/sitecore-jss-nextjs';
import classnames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import { useMobileViewport, useTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getMediaSizeParams, MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AppImage from 'frontend/components/common/AppImage';

import { getImageStyles } from './getImageStyles';
import { getDynamicImageSizes, getDynamicMediaSize } from './JSSImageNext.utils';

export type TJSSImageDynamicSize = Partial<Record<'desktop' | 'tablet' | 'mobile', { height: number; width: number }>>;
export type TJSSImageDynamicMediaSize = MediaSize | Partial<Record<'desktop' | 'tablet' | 'mobile', MediaSize>>;

interface IBaseJSSImageNextProps {
    [key: string]: any;
    field: Nullable<ISitecoreField<ISitecoreImage>>;
    fill?: boolean;
    mediaSize?: TJSSImageDynamicMediaSize;
    minimumMediaSize?: MediaSize;
    priority?: boolean;
    sizes?: string;
}

interface IPropsWithFill extends IBaseJSSImageNextProps {
    fill: true;
    dynamicSize?: TJSSImageDynamicSize;
    height?: number;
    width?: number;
}

interface IPropsWithoutFill extends IBaseJSSImageNextProps {
    height: number;
    width: number;
    dynamicSize?: TJSSImageDynamicSize;
    fill?: false;
}

interface IPropsWithDynamicSize extends IBaseJSSImageNextProps {
    dynamicSize?: TJSSImageDynamicSize;
    fill?: false;
    height?: number;
    width?: number;
}

export type TJSSImageProps = IPropsWithFill | IPropsWithoutFill | IPropsWithDynamicSize;

export const JSSImageNext: FunctionComponent<TJSSImageProps> = ({
    field,
    fill,
    priority,
    width,
    height,
    mediaSize,
    minimumMediaSize,
    sizes,
    dynamicSize,
    ...additionalProps
}) => {
    const { isEditMode } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));

    const isMobile = useMobileViewport();
    const isTablet = useTabletViewport();

    const sizeProps = useMemo(() => {
        if (fill) {
            return { fill };
        }

        const defaultSizes = { width: width ?? field?.value?.width, height: height ?? field?.value?.height };

        if (dynamicSize) {
            return getDynamicImageSizes(dynamicSize, isMobile, isTablet) ?? defaultSizes;
        }

        return defaultSizes;
    }, [width, height, dynamicSize, field, isMobile, isTablet, fill]);

    if (!field) {
        return null;
    }

    if (isEditMode) {
        return <SitecoreJSSImage field={field} {...additionalProps} />;
    }

    const { src, alt = '' } = field.value || {};

    if (!src) {
        return null;
    }

    const { styles, inlineStyles, className } = getImageStyles(field, fill);
    const actualMediaSize = getDynamicMediaSize(mediaSize, isMobile, isTablet, minimumMediaSize);
    const mediaParamsSize = actualMediaSize ? getMediaSizeParams(actualMediaSize) : undefined;
    const url = cmsUrls.media(src, mediaParamsSize);

    const { styles: additionalStyles = {}, className: additionalClassName, ...restAdditionalProps } = additionalProps;

    return (
        <>
            {styles}
            <AppImage
                src={url}
                style={{ ...inlineStyles, ...additionalStyles }}
                className={classnames(className, additionalClassName)}
                priority={priority || field.value.priority}
                alt={alt}
                sizes={sizes}
                {...sizeProps}
                {...restAdditionalProps}
            />
        </>
    );
};

export default memo(JSSImageNext);

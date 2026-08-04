import { FC } from 'react';
import { Image } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getImageFocalPointStyles } from 'frontend/utils/getImage';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

interface IJSSImageProps {
    [key: string]: any;
    field: Nullable<ISitecoreField<ISitecoreImage>>;
    dataTid?: string;
}

export const JSSImage: FC<IJSSImageProps> = ({ field, dataTid, ...additionalProps }) => {
    const { isEditMode, isScreenLessMedium } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
    }));

    if (!field) {
        return null;
    }

    if (isEditMode) {
        return <Image field={field} {...additionalProps} />;
    }

    if (additionalProps.srcSet) {
        additionalProps.srcSet = undefined;
    }

    const { src, width, height, alt = '' } = field.value || {};

    if (!src) {
        return null;
    }

    const styles = getImageFocalPointStyles(field.value, isScreenLessMedium);
    const url = cmsUrls.media(src);
    const aspectRatio = !!width && !!height && `${width / height}`;

    return styles ? (
        <div style={{ backgroundImage: `url(${url})`, ...styles }} {...additionalProps} data-tid={dataTid} />
    ) : (
        <img
            src={url}
            alt={alt || ''}
            data-tid={dataTid}
            {...additionalProps}
            style={{
                ...additionalProps.style,
                ...(aspectRatio ? { aspectRatio } : {}),
            }}
        />
    );
};

export default observer(JSSImage);

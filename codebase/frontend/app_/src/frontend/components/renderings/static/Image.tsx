import * as React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import { JSSImageNext, TJSSImageDynamicSize } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RouterLink from 'frontend/components/common/RouterLink';

export interface IImageFields {
    Image: ISitecoreField<ISitecoreImage>;
    Url: ISitecoreField<ISitecoreLink>;
    Link?: ISitecoreField<ISitecoreLink>;
}

interface IImageProps extends ISitecoreComponent<IImageFields> {
    height: number;
    width: number;
    dynamicSize?: TJSSImageDynamicSize;
    fill?: boolean;
    mediaSize?: MediaSize;
    onLinkClick?: (link: ISitecoreField<ISitecoreLink>) => void;
}

export const Image: React.FC<IImageProps> = props => {
    const { isEditMode } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));

    if (!props.fields) {
        return null;
    }

    const Link = props.fields.Url || props.fields.Link;

    if (isEditMode) {
        return <JSSImage field={props.fields.Image} />;
    }

    return (
        <RouterLink link={Link} onClick={(): void => props.onLinkClick?.(Link)}>
            <JSSImageNext
                field={props.fields.Image}
                width={props.width}
                height={props.height}
                fill={props.fill}
                dynamicSize={props.dynamicSize}
                mediaSize={props.mediaSize}
            />
        </RouterLink>
    );
};

export default observer(Image);

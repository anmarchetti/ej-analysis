import { FunctionComponent } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

interface IMasonryWrapperItemRenderingParameters {
    ItemOrderOnMobile: string;
}

export type TMasonryWrapperItemProps = ISitecoreComponent<null, IMasonryWrapperItemRenderingParameters>;

export const MasonryWrapperItem: FunctionComponent<TMasonryWrapperItemProps> = ({ params, rendering }) => {
    const isMobile = useMobileViewport();

    return (
        <div style={{ order: (isMobile && params?.ItemOrderOnMobile) || '1' }} data-tid='masonry-item-wrapper'>
            <Placeholder name={PlaceholderNames.MasonryItem} rendering={rendering} />
        </div>
    );
};

export default MasonryWrapperItem;

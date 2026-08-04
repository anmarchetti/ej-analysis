import * as React from 'react';

import useStore from 'frontend/hooks/useStore';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreImageItem } from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RouterLink from 'frontend/components/common/RouterLink';

interface ISocialIconsProps {
    fields: { items: ISitecoreImageItem[] };
}

const ICON_SIZE = 24;

const SocialIcons = (props: ISocialIconsProps) => {
    const { trackHomepageAction, sitePath } = useStore(stores => ({
        trackHomepageAction: stores.trackingStore.trackHomepageAction,
        sitePath: stores.layoutStore.sitePath,
    }));
    const icons = (props.fields?.items || []).filter(
        item => item.fields && !!item.fields.Image && !!item.fields.Link?.value?.href,
    );

    const handleClick = (index: number, item: ISitecoreImageItem) => {
        const link = item.fields.Link;

        trackHomepageAction(EventTypes.FooterClick, {
            location: 'Footer',
            position: `${index + 1}`,
            name: link?.value?.text || '',
            destination: buildSitecoreLinkFullUrl(link, sitePath),
            section: 'Social Media Link',
        });
    };

    return icons.length ? (
        <ul className='social-icons'>
            {icons.map((item, i) => (
                <li key={item.id} className='list-item--icon'>
                    <RouterLink
                        link={item.fields.Link}
                        onClick={() => handleClick(i, item)}
                        ariaLabel={item.fields.Link.value.text}
                    >
                        <JSSImageNext
                            field={item.fields.Image}
                            width={ICON_SIZE}
                            height={ICON_SIZE}
                            mediaSize={MediaSize.Small}
                        />
                    </RouterLink>
                </li>
            ))}
        </ul>
    ) : null;
};

export default SocialIcons;

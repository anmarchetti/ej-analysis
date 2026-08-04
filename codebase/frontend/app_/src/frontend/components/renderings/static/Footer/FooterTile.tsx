import { FC } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IFooterTileFields {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TFooterTileProps = ISitecoreComponent<IFooterTileFields>;

const IMAGE_SIZE = 64;

export const FooterTile: FC<TFooterTileProps> = props => {
    const { Title, Description } = props.fields || {};
    const { trackHomepageAction } = useStore(stores => ({
        trackHomepageAction: stores.trackingStore.trackHomepageAction,
    }));

    const trackFooterClick = (name: string, destination: string): void => {
        trackHomepageAction(EventTypes.FooterClick, {
            location: 'Footer',
            position: '',
            name,
            destination,
            section: Title?.value || '',
        });
    };

    const handleClickImage = (link: ISitecoreField<ISitecoreLink>): void => {
        const name = link.value.text;
        const destination = link.value.href;

        trackFooterClick(name, destination);
    };

    const handleClickLink = e => {
        const name = e.target.innerText;
        const destination = e.target.href;

        trackFooterClick(name, destination);
    };

    if (!props.fields) return null;

    return (
        <div className='footer-tile'>
            <div className='footer-tile__images'>
                <Placeholder
                    name={PlaceholderNames.Image}
                    rendering={props.rendering}
                    onLinkClick={handleClickImage}
                    mediaSize={MediaSize.Small}
                    width={IMAGE_SIZE}
                    height={IMAGE_SIZE}
                />
            </div>
            <div className='footer-tile__text'>
                {!!Title && <Text field={Title} tag='h4' className='footer-tile__title' />}
                {!!Description && <RichTextWithLinks field={Description} onLinkClick={handleClickLink} />}
            </div>
        </div>
    );
};

export default FooterTile;

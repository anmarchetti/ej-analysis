import * as React from 'react';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IImage } from 'models/data/IHotel';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreImageExternalItem } from 'models/sitecore/generic/ISitecoreField';

import HotelImageCarousel from './components/HotelImageCarousel';

interface IHotelImageCarouselItemsParams {
    items: ISitecoreImageExternalItem[];
}

interface IHotelImageCarouselBrowse extends ISitecoreComponent<IHotelImageCarouselItemsParams, null> {
    getSetting: (setting: string) => string;
    layoutFields: any;
}

export class HotelImageCarouselBrowse extends React.Component<IHotelImageCarouselBrowse> {
    private getImages = () => {
        const {
            rendering: { fields },
        } = this.props;
        const images: IImage[] = [];

        let sitecoreImages: IImage[] = [];

        if (fields && Array.isArray(fields) && fields.length > 0) {
            sitecoreImages = fields;
        } else if (Array.isArray(fields?.images) && fields.images.length > 0) {
            sitecoreImages = fields.images;
        }

        sitecoreImages.forEach(image => {
            if (image.medium || (image.large && image.small)) {
                images.push({
                    id: image.id,
                    large: image.large,
                    medium: image.medium,
                    small: image.small,
                    description: image.description,
                });
            }
        });

        return images;
    };

    render() {
        const offer = {
            hotel: {
                images: this.getImages(),
                name: this.props.layoutFields?.Name?.value,
            },
            accom: {
                isExt: this.props.layoutFields?.ExternalAccommodation?.value || false,
            },
        } as any;
        const fallbackImage = this.props.getSetting(SiteSettings.HotelFallbackImage);

        return (
            <HotelImageCarousel
                rendering={this.props.rendering}
                fallbackImage={fallbackImage}
                offer={offer}
                withoutSelection
            />
        );
    }
}

export default inject((stores: TStores) => ({
    layoutFields: stores.layoutStore.layout.sitecore.route.fields,
    getSetting: stores.layoutStore.getSetting,
}))(HotelImageCarouselBrowse);

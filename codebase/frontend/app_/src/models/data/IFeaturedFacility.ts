import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { IImage } from './IHotel';

export interface IFeaturedFacility {
    description: string;
    externalImage: IImage;
    image: string;
    link: {
        anchor: string;
        linkType: SitecoreLinkType;
        target: string;
        text: string;
        url: string;
    };
    title: string;
}

import React from 'react';
import { Guid } from 'guid-typescript';

import { IAnchorParameters } from 'models/data/IAnchorParameters';
import { IHotelInfoFields } from 'models/data/IHotelInfoFields';
import { IOffer } from 'models/data/IOffer';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import HotelInfo from './components/HotelInfo';

type THotelInfoBrowseProps = ISitecoreComponent<IHotelInfoFields, IAnchorParameters>;

export const HotelInfoBrowse: React.FC<THotelInfoBrowseProps> = props => {
    const offer: IOffer = {
        hotel: {
            facilities: [],
            description: props.fields?.HotelDescription || '',
            strapline: props.fields?.StrapLine || '',
        },
    } as any;

    return (
        <HotelInfo
            rendering={props.rendering}
            offer={offer}
            anchor={props.params ? props.params.Anchor : Guid.create().toString()}
            isShowEcoFacilityPlaceholder={props.rendering.isShowEcoFacilityPlaceholder}
        />
    );
};

export default HotelInfoBrowse;

import React, { FC } from 'react';

import { DestinationType } from 'models/enum/DestinationType';
import { HotelTypeIcons } from 'models/enum/HotelTypeIcons';
import IconBed from 'frontend/components/icons/Bed';
import IconMapMarker from 'frontend/components/icons/MapMarker';
import IconMapWithMarker from 'frontend/components/icons/MapWithMarker';
import IconPlainDeparture from 'frontend/components/icons/PlainDeparture';
import IconWorldGlobe from 'frontend/components/icons/WorldGlobe';
import SvgLuxury from 'frontend/components/icons-new/Luxury';

export interface ISearchBarSuggestionIconProps {
    icon?: string;
    type?: DestinationType;
}

const SearchBarSuggestionIcon: FC<ISearchBarSuggestionIconProps> = ({ icon, type }) => {
    if (icon === HotelTypeIcons.Luxury) {
        return <SvgLuxury />;
    }

    switch (type) {
        case DestinationType.Anywhere:
        case DestinationType.Country: {
            return <IconWorldGlobe />;
        }
        case DestinationType.VirtualCountry:
        case DestinationType.Region:
        case DestinationType.VirtualRegion: {
            return <IconMapMarker />;
        }
        case DestinationType.Resort:
        case DestinationType.VirtualResort: {
            return <IconMapWithMarker />;
        }
        case DestinationType.Hotel: {
            return <IconBed />;
        }
        case DestinationType.Airport:
        default: {
            return <IconPlainDeparture />;
        }
    }
};

export default SearchBarSuggestionIcon;

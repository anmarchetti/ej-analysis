import { FC } from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import * as Poster from 'frontend/components/common/Poster';
import { IExportButtonsFields } from 'frontend/components/renderings/ExportButtons/ExportButtons';

import HotelPosterContent from './components/HotelPosterContent';

export interface IHotelPosterFields {
    AirportLabel: ISitecoreField<string>;
    BoardLabel: ISitecoreField<string>;
    ConclusionLabel: ISitecoreField<string>;
    DepositLabel: ISitecoreField<string>;
    RoomLabel: ISitecoreField<string>;
    RoundUpDescription: ISitecoreField<string>;
    RoundUpTitle: ISitecoreField<string>;
}

export interface IHotelPosterProps extends ISitecoreComponent<IHotelPosterFields> {
    UMLogoImage: string;
    hasEjLogo: boolean;
    hasUMLogo: boolean;
    logoImage: ISitecoreField<ISitecoreImage>;
    posterFields: IExportButtonsFields;
    posterId: string;
}

export const HotelPoster: FC<IHotelPosterProps> = props => (
    <Poster.Root>
        <HotelPosterContent {...props} />
    </Poster.Root>
);

export default HotelPoster;

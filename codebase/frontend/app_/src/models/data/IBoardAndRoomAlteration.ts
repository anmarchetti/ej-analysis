import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IBoardAndRoomAlterationDrawerFields {
    AlterationBoardResultTextSingular: ISitecoreField<string>;
    AlterationBoardResultTitle: ISitecoreField<string>;
    AlterationChangingFromTitle: ISitecoreField<string>;
    AlterationResultRoomsSubtitle: ISitecoreField<string>; // is used only in rooms drawer (for room alteration)
    AlterationResultSubtitle: ISitecoreField<string>;
    AlterationRoomResultTextPlural: ISitecoreField<string>;
    AlterationRoomResultTextSingular: ISitecoreField<string>;
    AlterationRoomResultTitle: ISitecoreField<string>;
    AlterationSubtitle: ISitecoreField<string>;
}

export interface IBoardAndRoomAlterationInfoFields {
    AlterationExtendedInfoText: ISitecoreField<string>;
    AlterationExtendedInfoTitle: ISitecoreField<string>;
    AlterationInfoText: ISitecoreField<string>;
    AlterationInfoTitle: ISitecoreField<string>;
}

export interface IBoardAndRoomAlterationKidsInfoFields {
    FreeChildPlaceInfoText: ISitecoreField<string>;
    FreeChildPlaceInfoTitle: ISitecoreField<string>;
}

export interface IBoardAndRoomAlterationInfoFieldsProps {
    alterationExtendedInfoText: ISitecoreField<string>;
    alterationExtendedInfoTitle: ISitecoreField<string>;
    alterationInfoText: ISitecoreField<string>;
    alterationInfoTitle: ISitecoreField<string>;
}
export interface IBoardAndRoomAlterationKidsInfoFieldsProps {
    freeChildPlaceInfoText: ISitecoreField<string>;
    freeChildPlaceInfoTitle: ISitecoreField<string>;
}

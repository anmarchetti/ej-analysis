import { Tokens } from 'code/tokens';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { NextRoomDisplayOption } from 'models/enum/NextRoomDisplayOption';
import { IRoomTypesFields } from 'frontend/components/renderings/RoomTypes/RoomTypes';

const roomTypesFieldsMocks = (): IRoomTypesFields => ({
    Description: mockSitecoreField('Best room choice according to your selected duration and dates'),
    Title: mockSitecoreField('Your room'),
    TitleMultiple: mockSitecoreField('Your rooms'),
    TitleMobile: mockSitecoreField('Change your Room'),
    DescriptionMobile: mockSitecoreField('Fancy an upgrade? Here’s all our available room alternatives at this hotel.'),
    RoomUnderSelected: mockSitecoreField<NextRoomDisplayOption>(NextRoomDisplayOption.NextMostExpensiveToSelected),
    TitleNextToSelectedRoomSingular: mockSitecoreField(`${Tokens.Number} Room available`),
    TitleNextToSelectedRoomPlural: mockSitecoreField(`${Tokens.Number} Rooms available`),
    RoomInformation: mockSitecoreField('Room information'),
    AlternativeRoomsLabelSingular: mockSitecoreField('Alt room'),
    AlternativeRoomsLabelPlural: mockSitecoreField('Alt rooms'),
    AlterationInfoTitle: mockSitecoreField('Alteration info title'),
    AlterationInfoText: mockSitecoreField('Alteration info text'),
    FreeChildPlaceInfoTitle: mockSitecoreField('About your free child place'),
    FreeChildPlaceInfoText: mockSitecoreField('Free child place info text'),
    AlterationSubtitle: mockSitecoreField('Changing this room means a few changes to the package'),
    AlterationBoardResultTitle: mockSitecoreField('Board Alteration'),
    AlterationRoomResultTitle: mockSitecoreField('Room alterations'),
    AlterationResultRoomsSubtitle: mockSitecoreField(
        'Your new room selection requires an alteration to your other rooms which is included in the cost.',
    ),
    AlterationResultSubtitle: mockSitecoreField('Your new room selection requires an alteration to your board basis'),
    AlterationBoardResultTextSingular: mockSitecoreField('Your New Board'),
    AlterationRoomResultTextSingular: mockSitecoreField('Your New Room'),
    AlterationRoomResultTextPlural: mockSitecoreField('Your New Rooms'),
    AlterationChangingFromTitle: mockSitecoreField('Changing from'),
    AlterationExtendedInfoTitle: mockSitecoreField('Requires more room alterations'),
    AlterationExtendedInfoText: mockSitecoreField('This room requires a change to some or all of your selected rooms'),
});

export default roomTypesFieldsMocks;

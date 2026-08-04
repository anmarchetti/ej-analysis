import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IBoardTypesFields } from 'frontend/components/renderings/BoardTypes/BoardTypes';

export const boardTypesFields = (): IBoardTypesFields => ({
    Title: mockSitecoreField('Your board'),
    ShowLabel: mockSitecoreField('See all board options'),
    EditLabel: mockSitecoreField('Edit your board'),
    DrawerDescription: mockSitecoreField('Fancy an upgrade? Here`s all our available board choices for this holiday.'),
    DrawerCancel: mockSitecoreField('Cancel'),
    AlternativeBoardsTitleSingular: mockSitecoreField('Other board option'),
    HideLabel: mockSitecoreField('Hide board options'),
    DrawerTitle: mockSitecoreField('Change your board'),
    AlternativeBoardsTitlePlural: mockSitecoreField('Other board options'),
    AlterationSubtitle: mockSitecoreField('Changing to this board means a few other changes to the package'),
    AlterationBoardResultTitle: mockSitecoreField(''),
    AlterationRoomResultTitle: mockSitecoreField('Room Alteration'),
    AlterationResultSubtitle: mockSitecoreField('Your new board selection requires an alteration to your other rooms'),
    AlterationBoardResultTextSingular: mockSitecoreField(''),
    AlterationRoomResultTextSingular: mockSitecoreField('Your New Room'),
    AlterationRoomResultTextPlural: mockSitecoreField('Your New Rooms'),
    AlterationChangingFromTitle: mockSitecoreField('Changing From'),
    AlterationInfoTitle: mockSitecoreField('Requires room alteration'),
    AlterationInfoText: mockSitecoreField('This board requires a change to your selected room.'),
    FreeChildPlaceInfoTitle: mockSitecoreField('About your Free Child Place'),
    FreeChildPlaceInfoText: mockSitecoreField('Your free child place will not be valid on this board basis'),
    AlterationExtendedInfoTitle: mockSitecoreField('Requires room alteration'),
    AlterationExtendedInfoText: mockSitecoreField('This board requires a change to some or all of your selected rooms'),
    AlterationResultRoomsSubtitle: mockSitecoreField(''),
});

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IHoldLuggageItemFields, IHoldLuggageLists } from 'models/data/IHoldLuggage';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { SportEquipmentRestrictedSeasons } from 'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields';
import { IHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/HoldLuggagePopup';

export const getMockedLuggageItem = (
    description: string,
    name: string,
    icon: string,
    code: string,
    isEnabled: boolean,
): IHoldLuggageItemFields => ({
    Description: mockSitecoreField(description),
    Name: mockSitecoreField(name),
    Icon: mockSitecoreField(mockSitecoreImageField(icon)),
    Code: mockSitecoreField(code),
    IsLuggageItemEnabled: mockSitecoreField(isEnabled),
});

export const mockHoldLugggageLists: IHoldLuggageLists = {
    HoldLuggageItems: [
        {
            id: '1',
            fields: getMockedLuggageItem('Description1', 'Hold Baggage 23kg', 'Icon1', 'LUG', true),
        } as ISitecoreChildren<IHoldLuggageItemFields>,
        {
            id: '1',
            fields: getMockedLuggageItem('Description2', 'Hold Baggage 15kg', 'Icon2', 'LUS', true),
        } as ISitecoreChildren<IHoldLuggageItemFields>,
    ],
    SportsEquipmentItems: [
        {
            id: '8bca0fb6-b674-44e2-9f4b-d2f259547a3a',
            fields: getMockedLuggageItem('Bicycle description', 'Bicycle', 'IconBike', 'BIKE', true),
        } as ISitecoreChildren<IHoldLuggageItemFields>,
        {
            id: '48adb25b-9ebd-4ad1-be40-2675ec3719fd',
            fields: getMockedLuggageItem('Canoe description', 'Canoe', 'IconCanoe', 'CANO', true),
        } as ISitecoreChildren<IHoldLuggageItemFields>,
        {
            id: 'dbe333b6-b4d5-483a-9a2f-ed6592d5158e',
            fields: getMockedLuggageItem('Golf description', 'Golf Bag', 'IconGolf', 'GBAG', true),
        } as ISitecoreChildren<IHoldLuggageItemFields>,
        {
            id: 'b901a252-22dd-4968-9758-72d19ae3836d',
            fields: getMockedLuggageItem('Snowboard description', 'Snowboard', 'IconSnowboard', 'SNBD', true),
        } as ISitecoreChildren<IHoldLuggageItemFields>,
    ],
    SportsEquipmentSubtitle: mockSitecoreField('SportsEquipmentSubtitle'),
    SportEquipmentRestrictedSeasons,
};

export const mockHoldLuggagePopupFields: IHoldLuggagePopupFields = {
    BackToExtras: mockSitecoreField('BackToExtras'),
    NoLuggageAddedLabel: mockSitecoreField('NoLuggageAddedLabel'),
    NoLuggageAddedButton: mockSitecoreField('NoLuggageAddedButton'),
    Header: mockSitecoreField('Header'),
    DescriptionHoldLuggageAndSport: mockSitecoreField('HoldLuggageAndSportDescription'),
    DescriptionHoldLuggage: mockSitecoreField('HoldLuggageDescription'),
    DescriptionSport: mockSitecoreField('SportDescription'),
    DescriptionNote: mockSitecoreField('DescriptionNote'),
    AdditionalLuggageTitle: mockSitecoreField('AdditionalLuggageTitle'),
    LuggageAddedLabel: mockSitecoreField('LuggageAddedLabel'),
    LuggageAddedButton: mockSitecoreField('LuggageAddedButton'),
    PriceLabel: mockSitecoreField('PriceLabel'),
    PramTitle: mockSitecoreField('PramTitle'),
    PramIcon: mockSitecoreField(mockSitecoreImageField('PramIcon')),
    TitleCancelPopup: mockSitecoreField('TitleCancelPopup'),
    TextCancelPopup: mockSitecoreField('TextCancelPopup'),
    BackButtonCancelPopup: mockSitecoreField('BackButtonCancelPopup'),
    ContinueButtonCancelPopup: mockSitecoreField('ContinueButtonCancelPopup'),
    ShowMoreLuggage: mockSitecoreField('Show more weights'),
    HideAdditionalLuggage: mockSitecoreField('Hide additional weights'),
    SportsEquipmentTitle: mockSitecoreField('Sports equipment'),
    ShowMoreEquipment: mockSitecoreField('Show more sports equipment'),
    HideAdditionalEquipment: mockSitecoreField('Hide additional sports equipment'),
    DefaultBagsCounterPlural: mockSitecoreField('DefaultBagsCounterPlural'),
    DefaultBagsCounterSingle: mockSitecoreField('DefaultBagsCounterSingle'),
    DefaultBagsTitle: mockSitecoreField('DefaultBagsTitle'),
};

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IPassengerFields, ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { PassengerDisplayName } from 'models/enum/PassengerType';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

const mockPassengerFieldsFn = (
    title: string,
    constant: string,
    icon: string,
    code: string,
): ISitecoreChildren<IPassengerFields> => ({
    displayName: code,
    id: code,
    name: code,
    fields: {
        Title: mockSitecoreField(title),
        TitleConstant: mockSitecoreField(constant),
        Icon: mockSitecoreField(mockSitecoreImageField(icon)),
        Code: mockSitecoreField(code),
    },
});

export const mockAncillariesChildren: ISitecoreChildren<IPassengerFields>[] = [
    mockPassengerFieldsFn('{passengerName}', 'Adult {passengerIndex}', 'adult icon', PassengerDisplayName.Adult),
    mockPassengerFieldsFn(
        '{passengerName} + infant',
        'Adult {passengerIndex} + infant',
        'adult+infant icon',
        PassengerDisplayName.AdultInfant,
    ),
    mockPassengerFieldsFn(
        '{passengerName} (age {passengerAge})',
        'Child (age {passengerAge})',
        'child icon',
        PassengerDisplayName.Child,
    ),
];

export const mockSeatsAndBagsFields: ISeatsAndBagsFields = {
    Title: mockSitecoreField('Title'),
    BtnBookSeats: mockSitecoreField('BtnBookSeats'),
    BtnReturnSeats: mockSitecoreField('BtnReturnSeats'),
    BtnOutboundSeats: mockSitecoreField('BtnOutboundSeats'),
    BtnChangeSeats: mockSitecoreField('BtnChangeSeats'),
    OutboundTitle: mockSitecoreField('OutboundTitle'),
    ReturnTitle: mockSitecoreField('ReturnTitle'),
    InfoLink: mockSitecoreField({
        text: 'Test link text',
        href: 'https://www.example.com',
        linktype: SitecoreLinkType.External,
    }),
    SeatDescription: mockSitecoreField('SeatDescription'),
    FallbackBenefit: {
        id: 'id',
        fields: {
            Icon: mockSitecoreField(mockSitecoreImageField('Fallback Benefit Icon')),
            Description: mockSitecoreField('Fallback Benefit Description'),
            Name: mockSitecoreField('Fallback Benefit Name'),
            Code: mockSitecoreField('Fallback Benefit Code'),
        },
    },
    LegRoomDescription: mockSitecoreField('LegRoomDescription'),
    ErrorDepartureMessage: mockSitecoreField('ErrorDepartureMessage'),
    OutboundIcon: mockSitecoreField(mockSitecoreImageField('src')),
    ReturnIcon: mockSitecoreField(mockSitecoreImageField('src')),
    Children: mockAncillariesChildren,
    AmendSeatsAndBagsInfo: mockSitecoreField('AmendSeatsAndBagsInfo'),
    AmendSeatsNotAvailableMessage: mockSitecoreField('AmendSeatsNotAvailableMessage'),
    SeriesSeatFlights: mockSitecoreField('SeriesSeatFlights'),
    BookingOutOfSync: mockSitecoreField('BookingOutOfSync'),
    ReadLess: mockSitecoreField('ReadLess'),
    ReadMore: mockSitecoreField('ReadMore'),
    CollapseOpen: mockSitecoreField('CollapseOpen'),
    CollapseClose: mockSitecoreField('CollapseClose'),
    Icon: mockSitecoreField(mockSitecoreImageField('src')),
    SeatsSwitchedOff: mockSitecoreField('SeatsSwitchedOff'),
    OutboundIconAlt: mockSitecoreField(mockSitecoreImageField('src')),
    ReturnIconAlt: mockSitecoreField(mockSitecoreImageField('src')),
    SeriesSeatFlightsPageTitle: mockSitecoreField('SeriesSeatFlightsPageTitle'),
    BookingOutOfSyncTitle: mockSitecoreField('BookingOutOfSyncTitle'),
    ErrorDepartureMessageTitle: mockSitecoreField('ErrorDepartureMessageTitle'),
    SeatsSwitchedOffTitle: mockSitecoreField('SeatsSwitchedOffTitle'),
    SeriesSeatFlightsTitle: mockSitecoreField('SeriesSeatFlightsTitle'),
    UrgencyMessageSeatsThreshold: mockSitecoreField(3),
    UrgencyMessageText: mockSitecoreField('UrgencyMessageText'),
    itemUrgencyMessageText: mockSitecoreField('UrgencyMessageText'),
    UrgencyMessageTooltipText: mockSitecoreField('UrgencyMessageTooltipText'),
    SeatDescriptionLux: mockSitecoreField('Luxury Description'),
    LuxuryTitling: {
        fields: {
            Subtitle: mockSitecoreField('Luxury Subtitle'),
            Description: mockSitecoreField('Luxury Description'),
        },
        id: '1',
    },
    DefaultTitling: {
        fields: {
            Subtitle: mockSitecoreField('Default Subtitle'),
            Description: mockSitecoreField('Default Description'),
        },
        id: '2',
    },
    LuxuryInternalFlightTitling: {
        fields: {
            Subtitle: mockSitecoreField('LuxuryInternalFlightTitling Subtitle'),
            Description: mockSitecoreField('LuxuryInternalFlightTitling Description'),
        },
        id: '3',
    },
    LuxurySeriesSeatFlightsTitlePostBook: mockSitecoreField('LuxurySeriesSeatFlightsTitlePostBook'),
};

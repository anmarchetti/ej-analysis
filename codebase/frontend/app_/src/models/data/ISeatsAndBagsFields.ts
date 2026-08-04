import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';

import { IPassengerFlights } from './AncillariesInfo';
import { IAncillariesContentItem } from './IAncillariesContentItem';
import { IBookingInfo } from './IBookingInfo';
import { ISitecoreChildren } from './ISitecoreChildren';

export interface ISeatsAndBagsFields {
    AmendSeatsAndBagsInfo: ISitecoreField<string>;
    AmendSeatsNotAvailableMessage: ISitecoreField<string>;
    BookingOutOfSync: ISitecoreField<string>;
    BookingOutOfSyncTitle: ISitecoreField<string>;
    BtnBookSeats: ISitecoreField<string>;
    BtnChangeSeats: ISitecoreField<string>;
    BtnOutboundSeats: ISitecoreField<string>;
    BtnReturnSeats: ISitecoreField<string>;
    Children: ISitecoreChildren<IPassengerFields>[];
    CollapseClose: ISitecoreField<string>;
    CollapseOpen: ISitecoreField<string>;
    DefaultTitling: ISitecoreCompositeField<IAncillariesContentItem>;
    ErrorDepartureMessage: ISitecoreField<string>;
    ErrorDepartureMessageTitle: ISitecoreField<string>;
    FallbackBenefit: ISitecoreCompositeField<IBenefit>;
    Icon: ISitecoreField<ISitecoreImage>;
    InfoLink: ISitecoreField<ISitecoreLink>;
    LegRoomDescription: ISitecoreField<string>;
    LuxuryInternalFlightTitling: ISitecoreCompositeField<IAncillariesContentItem>;
    LuxurySeriesSeatFlightsTitlePostBook: ISitecoreField<string>;
    LuxuryTitling: ISitecoreCompositeField<IAncillariesContentItem>;
    OutboundIcon: ISitecoreField<ISitecoreImage>;
    OutboundIconAlt: ISitecoreField<ISitecoreImage>;
    OutboundTitle: ISitecoreField<string>;
    ReadLess: ISitecoreField<string>;
    ReadMore: ISitecoreField<string>;
    ReturnIcon: ISitecoreField<ISitecoreImage>;
    ReturnIconAlt: ISitecoreField<ISitecoreImage>;
    ReturnTitle: ISitecoreField<string>;
    SeatDescription: ISitecoreField<string>;
    SeatDescriptionLux: ISitecoreField<string>;
    SeatsSwitchedOff: ISitecoreField<string>;
    SeatsSwitchedOffTitle: ISitecoreField<string>;
    SeriesSeatFlights: ISitecoreField<string>;
    SeriesSeatFlightsPageTitle: ISitecoreField<string>;
    SeriesSeatFlightsTitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    UrgencyMessageSeatsThreshold: ISitecoreField<number>;
    UrgencyMessageText: ISitecoreField<string>;
    UrgencyMessageTooltipText: ISitecoreField<string>;
    itemUrgencyMessageText: ISitecoreField<string>;
}

export interface IPassengerFields {
    Code: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
    TitleConstant: ISitecoreField<string>;
}

export interface IBenefit {
    Code: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
}

export interface ISeatsAndBagsProps extends ISitecoreComponent<ISeatsAndBagsFields> {
    amendFlightsSeatSelection?: IPassengerFlights[];
    booking?: IBookingInfo;
    forceShowInnerHeading?: boolean;
    onAmendSeatsClick?: (e: React.MouseEvent) => void;
}

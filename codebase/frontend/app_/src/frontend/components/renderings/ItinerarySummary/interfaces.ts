import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IItineraryTransferFields extends ITransferInstructionsPopupFields {
    AllowTimeDescription: ISitecoreField<string>;
    AllowTimeTitle: ISitecoreField<string>;
    ArriveEarlierPickupText: ISitecoreField<string>;
    ArriveEarlierPrivateText: ISitecoreField<string>;
    ArriveEarlierSharedText: ISitecoreField<string>;
    DiffPickupLocationText: ISitecoreField<string>;
    DriverNameLabel: ISitecoreField<string>;
    DriverNumberLabel: ISitecoreField<string>;
    DurationLabel: ISitecoreField<string>;
    DurationText: ISitecoreField<string>;
    ErrorLoadingTransferText: ISitecoreField<string>;
    ExpandAllLabel: ISitecoreField<string>;
    FlightDelayDescription: ISitecoreField<string>;
    FlightDelayTitle: ISitecoreField<string>;
    HoursToGrayOut: ISitecoreField<number>;
    NoPickUpTimeText: ISitecoreField<string>;
    NoTransferDescription: ISitecoreField<string>;
    NoTransferTitle: ISitecoreField<string>;
    PickupInstructionsAndHelpLabel: ISitecoreField<string>;
    PickupInstructionsLabel: ISitecoreField<string>;
    PickupInstructionsText: ISitecoreField<string>;
    PickupLocationLabel: ISitecoreField<string>;
    PickupTimeFullText: ISitecoreField<string>;
    PickupTimeLabel: ISitecoreField<string>;
    PickupTimeShortText: ISitecoreField<string>;
    PrivateTransfer: ISitecoreField<string>;
    PrivateTransferProviderText: ISitecoreField<string>;
    SameLocationText: ISitecoreField<string>;
    SharedStandardBusText: ISitecoreField<string>;
    SharedTransfer: ISitecoreField<string>;
    SubjectToChangeText: ISitecoreField<string>;
    TimeMayVaryText: ISitecoreField<string>;
    ToAirportLabel: ISitecoreField<string>;
    ToHotelLabel: ISitecoreField<string>;
    VehicleLabel: ISitecoreField<string>;
    VehicleRegistrationLabel: ISitecoreField<string>;
}

export interface ITransferInstructionsPopupFields {
    AdditionalInstructions: ISitecoreField<string>;
    AppleMapLocationButtonLabel: ISitecoreField<string>;
    GoogleMapLocationButtonLabel: ISitecoreField<string>;
    InstructionsSubtitle: ISitecoreField<string>;
    LocationsTitle: ISitecoreField<string>;
    MapLocationButtonLabel: ISitecoreField<string>;
    MapLocationDescription: ISitecoreField<string>;
    ThreeWordsLocationButtonLabel: ISitecoreField<string>;
    ThreeWordsLocationDescription: ISitecoreField<string>;
}

export interface IItinerarySummarySummaryFields extends IItineraryTransferFields {
    AddressLabel: ISitecoreField<string>;
    AirportTitle: ISitecoreField<string>;
    AppleMapsLabel: ISitecoreField<string>;
    ArriveByLabel: ISitecoreField<string>;
    ArriveByText: ISitecoreField<string>;
    ArrivesLabel: ISitecoreField<string>;
    CloseAllButton: ISitecoreField<string>;
    CloseDrawerLabel: ISitecoreField<string>;
    DepartsLabel: ISitecoreField<string>;
    DirectionsLabel: ISitecoreField<string>;
    DurationLabel: ISitecoreField<string>;
    ExpandAllButton: ISitecoreField<string>;
    FastTrackIcon: ISitecoreField<ISitecoreImage>;
    FastTrackLabel: ISitecoreField<string>;
    FastTrackText: ISitecoreField<string>;
    FlightInbound: ISitecoreField<string>;
    FlightOutbound: ISitecoreField<string>;
    GoogleMapsLabel: ISitecoreField<string>;
    HideFullItineraryLabel: ISitecoreField<string>;
    HotelDetailsLabel: ISitecoreField<string>;
    HotelTitle: ISitecoreField<string>;
    ItineraryTitle: ISitecoreField<string>;
    MapsApplicationLabel: ISitecoreField<string>;
    NoTransferDescription: ISitecoreField<string>;
    NoTransferTitle: ISitecoreField<string>;
    RoomsLabelPlural: ISitecoreField<string>;
    RoomsLabelSingular: ISitecoreField<string>;
    SpeedyBoardingIcon: ISitecoreField<ISitecoreImage>;
    SpeedyBoardingLabel: ISitecoreField<string>;
    SpeedyBoardingText: ISitecoreField<string>;
    SpeedyBoardingTooltip: ISitecoreField<string>;
    TransferTitle: ISitecoreField<string>;
    ViewFullItineraryLabel: ISitecoreField<string>;
}

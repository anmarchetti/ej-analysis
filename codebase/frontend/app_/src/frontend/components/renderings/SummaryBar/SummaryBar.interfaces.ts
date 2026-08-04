import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface ISummaryBarSitecoreFields {
    CommonFieldsItemIncluded: ISitecoreField<string>;
    DisableTransferAndParking: ISitecoreField<boolean>;
    EnableEditButtons: ISitecoreField<boolean>;
    FlightSectionExtrasDropdown: ISitecoreField<string>;
    FlightSectionExtrasPram: ISitecoreField<string>;
    FlightSectionSeatTypeExtraLegroom: ISitecoreField<string>;
    FlightSectionSeatTypeRearStandard: ISitecoreField<string>;
    FlightSectionSeatTypeStandard: ISitecoreField<string>;
    FlightSectionSeatTypeUpFront: ISitecoreField<string>;
    FlightSectionTitle: ISitecoreField<string>;
    FlightSectionToDestination: ISitecoreField<string>;
    MerchandiseBannerButtonLabel: ISitecoreField<string>;
    MerchandiseBannerText: ISitecoreField<string>;
    NonRefundableLabel: ISitecoreField<string>;
    PriceSectionTotal: ISitecoreField<string>;
    RefundableLabel: ISitecoreField<string>;
    RoomAndBoardSectionTitle: ISitecoreField<string>;
    ShowRefundableLabel: ISitecoreField<boolean>;
    SummaryBarExpanderTitle: ISitecoreField<string>;
    SummaryBarTitle: ISitecoreField<string>;
    TransferAndParkingNoTransfer: ISitecoreField<string>;
    TransferAndParkingTitle: ISitecoreField<string>;
}

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';

export const mockSummaryBarSitecoreFields: ISummaryBarSitecoreFields = {
    CommonFieldsItemIncluded: mockSitecoreField('CommonFieldsItemIncluded'),
    ShowRefundableLabel: mockSitecoreField(false),
    DisableTransferAndParking: mockSitecoreField(false),
    EnableEditButtons: mockSitecoreField(true),
    FlightSectionExtrasDropdown: mockSitecoreField('FlightSectionExtrasDropdown'),
    FlightSectionExtrasPram: mockSitecoreField('FlightSectionExtrasPram'),
    FlightSectionSeatTypeExtraLegroom: mockSitecoreField('FlightSectionSeatTypeExtraLegroom'),
    FlightSectionSeatTypeRearStandard: mockSitecoreField('FlightSectionSeatTypeRearStandard'),
    FlightSectionSeatTypeStandard: mockSitecoreField('FlightSectionSeatTypeStandard'),
    FlightSectionSeatTypeUpFront: mockSitecoreField('FlightSectionSeatTypeUpFront'),
    FlightSectionTitle: mockSitecoreField('FlightSectionTitle'),
    FlightSectionToDestination: mockSitecoreField('FlightSectionToDestination'),
    MerchandiseBannerButtonLabel: mockSitecoreField('MerchandiseBannerButtonLabel'),
    MerchandiseBannerText: mockSitecoreField('MerchandiseBannerText'),
    NonRefundableLabel: mockSitecoreField('NonRefundableLabel'),
    PriceSectionTotal: mockSitecoreField('PriceSectionTotal'),
    RefundableLabel: mockSitecoreField('RefundableLabel'),
    RoomAndBoardSectionTitle: mockSitecoreField('RoomAndBoardSectionTitle'),
    SummaryBarExpanderTitle: mockSitecoreField('SummaryBarExpanderTitle'),
    SummaryBarTitle: mockSitecoreField('SummaryBarTitle'),
    TransferAndParkingNoTransfer: mockSitecoreField('TransferAndParkingNoTransfer'),
    TransferAndParkingTitle: mockSitecoreField('TransferAndParkingTitle'),
};

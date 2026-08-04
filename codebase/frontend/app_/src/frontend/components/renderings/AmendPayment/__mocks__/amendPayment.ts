import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { mockPriceBreakdownFields } from 'frontend/components/common/PriceBreakdown/__mocks__/priceBreakdown';
import { IPaymentPriceBreakdownFields } from 'frontend/components/renderings/AmendPayment/interfaces';

export const mockPaymentPriceBreakdownFields: IPaymentPriceBreakdownFields = {
    ...mockPriceBreakdownFields,
    FlightChange: mockSitecoreField('Flight change'),
    DatesChange: mockSitecoreField('Date change'),
    RoomAndBoardChange: mockSitecoreField('Room and board change'),
    TransferChange: mockSitecoreField('Transfer change'),
    SeatsChange: mockSitecoreField('Seats change'),
    HotelChange: mockSitecoreField('Hotel change'),
    ChangeFeeTitle: mockSitecoreField('Change fee'),
    PreviousBalanceLabel: mockSitecoreField('Previous Balance'),
    ChangeTooltip: mockSitecoreField(
        `Price subject to change & availability due to daily system updates. The price displayed here does factor in any change to your promotional code.`,
    ),
};

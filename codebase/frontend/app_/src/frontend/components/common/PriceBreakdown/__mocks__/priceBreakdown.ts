import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IFeePerPerson } from 'models/data/IAmendBookingFlights';
import { IPriceBreakdownItem } from 'frontend/components/common/PriceBreakdown/components/PriceBreakdownItem/PriceBreakdownItem';
import { IPriceBreakdownFields } from 'frontend/components/common/PriceBreakdown/PriceBreakdown';

export const mockPriceBreakdownFields: IPriceBreakdownFields = {
    ChangeFeeTitle: mockSitecoreField('Change fee'),
    PreviousBalanceLabel: mockSitecoreField('Previous Balance'),
    TotalCostOfChange: mockSitecoreField('Total cost of change'),
    PriceBreakdownTitle: mockSitecoreField('Price Breakdown'),
    PayNow: mockSitecoreField('Pay now'),
    RefundAmount: mockSitecoreField('Refund amount'),
    NoChangeTotal: mockSitecoreField('Total'),
    HolidayCredit: mockSitecoreField('Holiday credit'),
};

export const mockPriceBreakdownItems: IPriceBreakdownItem[] = [
    {
        breakdownTitle: 'Flight change',
        amount: 100,
    },
    {
        breakdownTitle: 'Other change',
        amount: 50,
        tooltipText: 'It is tooltip text',
    },
];

export const mockFeesPerPersons: IFeePerPerson[] = [
    { feesCount: 1, feesPerPersonAmount: 10 },
    { feesCount: 2, feesPerPersonAmount: 5 },
];

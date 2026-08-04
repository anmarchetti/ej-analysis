import { mockSitecoreField } from 'frontend/utils/tests.utils';
import {
    BreakdownItemId,
    ICancellationBreakdownFields,
} from 'frontend/components/renderings/CancellationBreakdown/CancellationBreakdown';

export const mockCancellationBreakdownFields: ICancellationBreakdownFields = {
    Title: mockSitecoreField('Title'),
    Subtext: mockSitecoreField('Subtext'),
    BottomText: mockSitecoreField('BottomText'),
    TradeBookingsBottomText: mockSitecoreField('Trade Bookings Bottom Text'),
    TradeBookingsSubtext: mockSitecoreField('Trade Bookings Subtext'),
    Children: [
        {
            displayName: '1',
            fields: {
                Description: mockSitecoreField('Child Description 1'),
                UniqueId: mockSitecoreField(BreakdownItemId.Date),
                Title: mockSitecoreField('Child Title 1'),
            },
            id: '1',
            name: '1',
        },
        {
            displayName: '2',
            fields: {
                Description: mockSitecoreField('Child Description 2'),
                UniqueId: mockSitecoreField(BreakdownItemId.Email),
                Title: mockSitecoreField('Child Title 2'),
            },
            id: '2',
            name: '2',
        },
        {
            displayName: '3',
            fields: {
                Description: mockSitecoreField('Child Description 3'),
                UniqueId: mockSitecoreField(BreakdownItemId.CreditRefund),
                Title: mockSitecoreField('Child Title 3'),
            },
            id: '3',
            name: '3',
        },
        {
            displayName: '4',
            fields: {
                Description: mockSitecoreField('Child Description 4'),
                UniqueId: mockSitecoreField(BreakdownItemId.OriginalRefund),
                Title: mockSitecoreField('Child Title 4'),
            },
            id: '4',
            name: '4',
        },
        {
            displayName: '5',
            fields: {
                Description: mockSitecoreField('Child Description 5'),
                UniqueId: mockSitecoreField(BreakdownItemId.TradeBookingEmail),
                Title: mockSitecoreField('Child Title 5'),
            },
            id: '5',
            name: '5',
        },
        {
            displayName: '6',
            fields: {
                Description: mockSitecoreField('Child Description 6'),
                UniqueId: mockSitecoreField(BreakdownItemId.TradeBookingDate),
                Title: mockSitecoreField('Child Title 6'),
            },
            id: '6',
            name: '6',
        },
    ],
};

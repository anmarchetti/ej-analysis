import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { CreditExpiryState } from 'models/data/MyCreditInfo';
import { RefundType } from 'frontend/components/renderings/ViewBooking/CancelBookingBanner/CancelBookingBanner';
import { IRefundInfoFields } from 'frontend/components/renderings/ViewBooking/RefundInfo/RefundInfo';

export const mockRefundInfoFields: IRefundInfoFields = {
    ExpiryPopupCTA: mockSitecoreField('Continue to cancel'),
    ExpiryPopupCancelCTA: mockSitecoreField('Back to view booking'),
    ExpiryPopupItems: [
        {
            fields: {
                CreditExpiryState: mockSitecoreField(CreditExpiryState.ExpiredOnly),
                Title: mockSitecoreField('Credit expired'),
                Subheading: mockSitecoreField('Your credit has expired'),
                Text: mockSitecoreField('<p>Expired credit text</p>'),
            },
            id: 'expiry-1',
        },
    ],
    Children: [
        {
            fields: {
                RefundType: { fields: { Value: mockSitecoreField(RefundType.CreditAndCashRefund) } },
                Title: mockSitecoreField('Credit And Cash Refund'),
                Description: mockSitecoreField('Credit And Cash Refund Text'),

                CancelButtonText: mockSitecoreField('Credit And Cash Refund Button'),
                IsCancelButtonHidden: mockSitecoreField(false),
                ShowContactUsButton: mockSitecoreField(false),
                TermsAndConditionsLink: mockSitecoreField(mockSitecoreLinkField()),
            },
            id: '1',
        },
        {
            fields: {
                RefundType: { fields: { Value: mockSitecoreField(RefundType.OnlyCredit) } },
                Title: mockSitecoreField('Only Credit'),
                Description: mockSitecoreField('Only Credit Text'),
                ShowContactUsButton: mockSitecoreField(false),
                CancelButtonText: mockSitecoreField('Only Credit Button'),
                IsCancelButtonHidden: mockSitecoreField(false),
                TermsAndConditionsLink: mockSitecoreField(mockSitecoreLinkField()),
            },
            id: '2',
        },
        {
            fields: {
                RefundType: { fields: { Value: mockSitecoreField(RefundType.NoRefund) } },
                Title: mockSitecoreField('No Refund'),
                Description: mockSitecoreField('No Refund Text'),
                CancelButtonText: mockSitecoreField('No Refund Button'),
                IsCancelButtonHidden: mockSitecoreField(true),
                ShowContactUsButton: mockSitecoreField(false),
                TermsAndConditionsLink: mockSitecoreField(mockSitecoreLinkField()),
            },
            id: '3',
        },
        {
            fields: {
                RefundType: { fields: { Value: mockSitecoreField(RefundType.RefundByDestinationRule) } },
                Title: mockSitecoreField('Refund By Destination Rule'),
                Description: mockSitecoreField('Refund By Destination Rule Text'),
                CancelButtonText: mockSitecoreField('Refund By Destination Rule Button'),
                IsCancelButtonHidden: mockSitecoreField(false),
                ShowContactUsButton: mockSitecoreField(false),
                TermsAndConditionsLink: mockSitecoreField(mockSitecoreLinkField()),
            },
            id: '4',
        },
        {
            fields: {
                RefundType: { fields: { Value: mockSitecoreField(RefundType.RefundByAgency) } },
                Title: mockSitecoreField('Refund By Agency'),
                Description: mockSitecoreField('Refund By Agency Text'),
                CancelButtonText: mockSitecoreField(''),
                IsCancelButtonHidden: mockSitecoreField(true),
                TermsAndConditionsLink: mockSitecoreField(
                    mockSitecoreLinkField('/trade-conditions', 'Contact your agency'),
                ),
                ShowContactUsButton: mockSitecoreField(false),
            },
            id: '5',
        },
        {
            fields: {
                RefundType: { fields: { Value: mockSitecoreField(RefundType.LessThanXHours) } },
                Title: mockSitecoreField('Less Than X Hours'),
                Description: mockSitecoreField('Less Than X Hours Text'),
                CancelButtonText: mockSitecoreField('Less Than X Hours Button'),
                IsCancelButtonHidden: mockSitecoreField(false),
                TermsAndConditionsLink: mockSitecoreField(mockSitecoreLinkField()),
                ShowContactUsButton: mockSitecoreField(true),
            },
            id: '6',
        },
        {
            fields: {
                RefundType: { fields: { Value: mockSitecoreField(RefundType.RefundUnavailable) } },
                Title: mockSitecoreField('Refund Unavailable'),
                Description: mockSitecoreField('Refund Unavailable Text'),
                CancelButtonText: mockSitecoreField(''),
                IsCancelButtonHidden: mockSitecoreField(true),
                TermsAndConditionsLink: mockSitecoreField(mockSitecoreLinkField()),
                ShowContactUsButton: mockSitecoreField(false),
            },
            id: '7',
        },
        {
            fields: {
                RefundType: { fields: { Value: mockSitecoreField(RefundType.OriginalPayment) } },
                Title: mockSitecoreField('Original Payment Refund'),
                Description: mockSitecoreField('Original Payment Refund Text'),
                CancelButtonText: mockSitecoreField('Original Payment Refund Button'),
                IsCancelButtonHidden: mockSitecoreField(false),
                TermsAndConditionsLink: mockSitecoreField(mockSitecoreLinkField()),
                ShowContactUsButton: mockSitecoreField(false),
            },
            id: '8',
        },
    ],
};

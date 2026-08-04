import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import { IPriceBreakdownFields } from 'frontend/components/common/PriceBreakdown/PriceBreakdown';
import { ICancelBookingFields } from 'frontend/components/renderings/CancelBooking/CancelBooking';
import { RefundPopups } from 'frontend/components/renderings/CancelBooking/CancelBooking.utils';
import { ICancellationAccordionFields } from 'frontend/components/renderings/CancelBooking/components/CancellationAccordion/CancellationAccordion';
import { ICancellationConfirmationFields } from 'frontend/components/renderings/CancelBooking/components/CancellationConfirmation/CancellationConfirmation';
import {
    ICancellationErrorPopupFields,
    IFailedToLoadPopupFields,
} from 'frontend/components/renderings/CancelBooking/components/CancellationErrorPopup/CancellationErrorPopup';
import { IRefundOption } from 'frontend/components/renderings/CancelBooking/components/RefundOptions/RefundOptions';
import { IRefundOptionsOTUCFields } from 'frontend/components/renderings/CancelBooking/components/RefundOptionsOTUC/RefundOptionsOTUC';

export const cancellationConfirmationFieldsMock: ICancellationConfirmationFields = {
    ImportantInfoTitle: mockSitecoreField('Important information'),
    ImportantInfo: mockSitecoreField(
        `When you click ’Confirm’, we'll cancel your holiday straight away. We'll process your easyJet holidays credit for the amount specified and this will be immediately available on your online account. Once you've made this change, you won’t be able to reverse it. We'll email you with confirmation.`,
    ),
    ConfirmationCheckboxDescription: mockSitecoreField(
        'Tick this box to confirm you agree to proceed with cancelling your booking, including agreeing to our our easyJet holiday single use credit terms and conditions for any credit issued.',
    ),
    ConfirmButtonLabel: mockSitecoreField('Cancel holiday'),
};

export const luggageFieldsMock: ILuggageInfoFields = {
    LuggageInfoTitle: mockSitecoreField('Your luggage'),
    PramName: mockSitecoreField('Pram or Pushchair'),
    SportEquipmentsLabel: mockSitecoreField('Sports equipment'),
};

export const refundOptionsFieldsMock: ISitecoreChildren<IRefundOption>[] = [
    {
        displayName: 'refund 1',
        fields: {
            CashLabel: mockSitecoreField('easyJet holidays credit'),
            CreditLabel: mockSitecoreField('One time use credit'),
            OptionTitle: mockSitecoreField('easyJet holidays credit'),
            TotalLabel: mockSitecoreField('Total'),
            RefundUniqueId: mockSitecoreField('CreditOTUC'),
            Popups: [
                {
                    fields: {
                        IsLinkVisible: mockSitecoreField(true),
                        LinkText: mockSitecoreField('LinkText1'),
                        TitlePopup: mockSitecoreField('TitlePopup1'),
                        TextPopup: mockSitecoreField('TextPopup1'),
                        PopupUniqueId: mockSitecoreField(RefundPopups.DepositPartialOTUC),
                    },
                    id: '1',
                    displayName: 'popup1',
                    name: 'popup1',
                },
                {
                    fields: {
                        IsLinkVisible: mockSitecoreField(true),
                        LinkText: mockSitecoreField('LinkText2'),
                        TitlePopup: mockSitecoreField('TitlePopup2'),
                        TextPopup: mockSitecoreField('TextPopup2'),
                        PopupUniqueId: mockSitecoreField('Credit'),
                    },
                    id: '2',
                    displayName: 'popup2',
                    name: 'popup2',
                },
            ],
        },
        id: '1',
        name: 'refund1',
    },
    {
        displayName: 'refund 2',
        fields: {
            CashLabel: mockSitecoreField('Refunded to original payment card'),
            CreditLabel: mockSitecoreField('One time use credit'),
            OptionTitle: mockSitecoreField('Original payment method'),
            TotalLabel: mockSitecoreField('Total'),
            RefundUniqueId: mockSitecoreField('Refund'),
            Popups: [],
        },
        id: '2',
        name: 'refund2',
    },
];

export const refundOptionsOTUCFieldsMock: IRefundOptionsOTUCFields = {
    NoRefundTitle: mockSitecoreField('No refund available'),
    DepositOnlyCloseToDepartureDescription: mockSitecoreField('DepositOnlyCloseToDepartureDescription'),
    NoRefundDescription: mockSitecoreField('DepositOnlyOTUCDescription'),
    Children: refundOptionsFieldsMock,
    DepositOnlyPaidDescription: mockSitecoreField('DepositOnlyPaidDescription'),
    NoPaymentMadeDescription: mockSitecoreField('NoPaymentMadeDescription'),
    PaidLessThanTotalChargeDescription: mockSitecoreField('PaidLessThanTotalChargeDescription'),
};

export const cancellationAccordionFieldsMock: ICancellationAccordionFields = {
    ...luggageFieldsMock,
    ...cancellationConfirmationFieldsMock,
    ...refundOptionsOTUCFieldsMock,
    StepOneTitle: mockSitecoreField('STEP 1: REVIEW YOUR HOLIDAY'),
    StepTwoTitle: mockSitecoreField('STEP 2: PICK HOW YOU’D WANT TO BE REFUNDED'),
    StepThreeTitle: mockSitecoreField('STEP 3: CANCEL YOUR HOLIDAY'),
    StepTwoNoRefundTitle: mockSitecoreField('STEP 2: NO REFUND AVAILABLE'),
};

export const refundOptionsContentMock: ISitecoreChildren<IRefundOption>[] = [
    ...refundOptionsFieldsMock,
    {
        displayName: 'refund 3',
        fields: {
            Popups: [
                {
                    fields: {
                        IsLinkVisible: mockSitecoreField(true),
                        LinkText: mockSitecoreField('LinkText1'),
                        TitlePopup: mockSitecoreField('TitlePopup1'),
                        TextPopup: mockSitecoreField('TextPopup1'),
                        PopupUniqueId: mockSitecoreField(RefundPopups.DepositPartialOTUC),
                    },
                    id: '1',
                    displayName: 'popup1',
                    name: 'popup1',
                },
            ],
            CashLabel: mockSitecoreField('Refunded to original payment card'),
            CreditLabel: mockSitecoreField('One time use credit'),
            OptionTitle: mockSitecoreField('Original payment method'),
            TotalLabel: mockSitecoreField('Total'),
            RefundUniqueId: mockSitecoreField('OriginalPayment'),
        },
        id: '3',
        name: 'refund3',
    },
];

const priceBreakdownFieldsMock: IPriceBreakdownFields = {
    PriceBreakdownTitle: mockSitecoreField('Refund breakdown'),
    NoChangeTotal: mockSitecoreField('Total refund'),
    PayNow: mockSitecoreField('Total refund'),
    RefundAmount: mockSitecoreField('Total refund'),
    HolidayCredit: mockSitecoreField('Holiday credit'),
};

export const errorPopupFieldsMock: ICancellationErrorPopupFields = {
    ErrorPopupTitle: mockSitecoreField('Cancellation failed'),
    ErrorPopupDescription: mockSitecoreField(
        'Sorry, but an error has occurred, and we have been unable to process your holiday cancellation. Please try again. Please call the call centre for additional support 01124 546 2305',
    ),
    ErrorPopupButtonLabel: mockSitecoreField('Back to view booking'),
};

export const infoErrorPopupFieldsMock: IFailedToLoadPopupFields = {
    FailedToLoadPopupTitle: mockSitecoreField('FailedToLoadPopupTitle'),
    FailedToLoadPopupDescription: mockSitecoreField('FailedToLoadPopupDescription'),
    FailedToLoadPopupButtonLabel: mockSitecoreField('FailedToLoadPopupButtonLabel'),
};

export const cancelBookingFieldsMock: ICancelBookingFields = {
    ...cancellationAccordionFieldsMock,
    ...priceBreakdownFieldsMock,
    ...errorPopupFieldsMock,
    ...infoErrorPopupFieldsMock,
    Children: refundOptionsFieldsMock,
    Deposit: mockSitecoreField('Deposit'),
    TotalCost: mockSitecoreField('Total Cost'),
    PriceBreakdownTitleStepOne: mockSitecoreField('PRICE BREAKDOWN'),
    AmountPaidExcludeDeposit: mockSitecoreField('AmountPaidExcludeDeposit'),
    PaidLabel: mockSitecoreField('You paid'),
    CancellationChargeLabel: mockSitecoreField('Cancellation Charge'),
    CancellationChargeTotalLabel: mockSitecoreField('Cancellation Charge Total'),
    ChangeFeeLabel: mockSitecoreField('Change Fee'),
};

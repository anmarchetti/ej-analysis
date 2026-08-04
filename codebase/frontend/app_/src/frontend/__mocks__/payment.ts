import { CurrencyCode } from 'code/currency';
import { IAmendPaymentPayload } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IAmendPaymentInfo } from 'models/data/IAmendBookingFlights';
import { ILivePrice } from 'models/data/ILivePrice';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { BillingInfo, IBillingInfo } from 'models/data/payment/BillingInfo';
import { IAmendPaymentTrackingPayload } from 'models/data/tracking/IProduct';
import { ApiErrors } from 'models/enum/ApiErrors';
import { HolidayThemesTypesCodes } from 'models/enum/HolidayThemes';
import { mockFeesPerPersons } from 'frontend/components/common/PriceBreakdown/__mocks__/priceBreakdown';
import { IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';

import { mockAddress } from './address';
import { mockTrackingHotelInitialData } from './amendHotel';
import { mockBooking } from './booking';
import { luggageInfoMock } from './extraLuggage';
import { mockSecondaryTrackingProduct } from './tracking';
import { mockTransfers } from './transfer';

export const mockAmendPaymentRefundInfo: IAmendPaymentInfo = {
    amendmentCharges: -80,
    amendmentChargesWithoutFees: -100,
    feesPerPersons: [
        { feesCount: 1, feesPerPersonAmount: 10 },
        { feesCount: 2, feesPerPersonAmount: 5 },
    ],
    packagePriceWithFees: 1200,
    packagePriceWithoutFees: 1120,
    totalFeesAmount: 20,
};

export const mockAmendPaymentInfo: IAmendPaymentInfo = {
    amendmentCharges: 100,
    amendmentChargesWithoutFees: 80,
    feesPerPersons: mockFeesPerPersons,
    packagePriceWithFees: 1200,
    packagePriceWithoutFees: 1120,
    totalFeesAmount: 20,
};

export const mockPaymentHistory = [
    {
        amount: 500,
        paymentDate: '2023-05-01',
        card: {
            number: '**** **** **** 1234',
            code: '123',
        },
        isCredit: false,
    },
    {
        amount: 1500,
        paymentDate: '2023-05-15',
        card: {
            number: '**** **** **** 5678',
            code: '456',
        },
        isCredit: true,
    },
];

export const mockPaymentInfo: IPaymentInfo = {
    depositPrice: 1000,
    pricePP: 500,
    totalPrice: 2000,
    paymentHistory: mockPaymentHistory,
    balanceDueDate: '2023-06-01',
    allowPayBalanceDueDate: '2023-05-25',
    depositDueDate: '2023-04-30',
    balanceDueAmount: 1000,
    agentComission: 100,
    commissionIncludingVat: 120,
    currency: CurrencyCode.GBP,
    allowPayOutstandingBalanceDays: 28,
};

export const mockPriceBreakdownItems: IPriceBreakdownItem[] = [
    {
        code: 'ITEM001',
        name: 'Item 1',
        amount: 50,
        quantity: 2,
    },
    {
        code: 'ITEM002',
        name: 'Item 2',
        amount: 30,
        quantity: 1,
    },
];

export const mockLivePrice: ILivePrice = {
    accomCode: 'accomCode',
    geog: 'US',
    price: 1000,
    pricePP: 500,
    touristTax: 100,
    touristTaxPP: 50,
    currency: CurrencyCode.GBP,
    searchCriteria: {
        adults: 2,
        children: 1,
        childAges: [5],
        infants: 0,
        id: '12345',
        date: '2023-08-15',
        depPt: 'LHR',
        duration: 7,
        range: {
            start: '2023-08-15',
            end: '2023-08-22',
        },
        themeTypesCodes: [HolidayThemesTypesCodes.Family, HolidayThemesTypesCodes.Beach],
    },
    promotion: {
        title: 'Special Offer',
        description: 'Get 20% off your booking',
        bannerDescription: '20% Off',
        cardDescription: 'cardDescription',
    },
    transfers: mockTransfers,
    extraLuggageInfo: luggageInfoMock,
    priceExcludingTouristTax: 900,
    pricePPExcludingTouristTax: 450,
};

export const mockBillingInfo: IBillingInfo = {
    fullName: 'Arnold Schwarzenegger',
    address: mockAddress.address,
    address2: mockAddress.address2,
    city: mockAddress.townCity,
    postCode: mockAddress.postCode,
};

export const mockAmendTrackingPayload: IAmendPaymentTrackingPayload = {
    initialData: mockTrackingHotelInitialData,
    secondaryProducts: {
        roomAndBoard: mockSecondaryTrackingProduct,
        transfers: mockSecondaryTrackingProduct,
    },
};

export const mockAmendPaymentPayload: IAmendPaymentPayload = {
    paymentInfo: mockPaymentInfo,
    bookingReference: mockBooking.bookingReference,
    date: mockBooking.package.accom.startDate,
    lastName: 'Schwarzenegger',
    package: mockBooking.package,
    discountCode: 'discountCode',
    billingInfo: new BillingInfo(
        mockBillingInfo.fullName,
        mockBillingInfo.address,
        mockBillingInfo.address2,
        mockBillingInfo.postCode,
    ),
    trackingData: mockAmendTrackingPayload,
};

export const mockPaymentError: IPaymentFailureItem = {
    messageKey: 'messageKey',
    descriptionKey: 'descriptionKey',
    isFatal: false,
    code: ApiErrors.CancelPaymentError,
    correlationId: 'correlationId',
};

export const mockPaymentFields: IPaymentPageFields = {
    PayWithDepositAttention: mockSitecoreField('PayWithDepositAttention'),
    PayWithDepositDescription: mockSitecoreField('PayWithDepositDescription'),
    PayWithDepositDescriptionOnePassenger: mockSitecoreField('PayWithDepositDescriptionOnePassenger'),
    PayFullDescription: mockSitecoreField('PayFullDescription'),
    ImportantInformation: mockSitecoreField('ImportantInformation'),
    ImportantInformationConfirmation: mockSitecoreField('ImportantInformationConfirmation'),
    PaymentDeny: mockSitecoreField('PaymentDeny'),
    AmountLeftToPay: mockSitecoreField('AmountLeftToPay'),
    CreditDebitCardLabel: mockSitecoreField('CreditDebitCardLabel'),
    PayFullDescriptionIncludingTax: mockSitecoreField('PayFullDescriptionIncludingTax'),
    PayWithDepositDescriptionIncludingTax: mockSitecoreField('PayWithDepositDescriptionIncludingTax'),
    PayWithDepositDescriptionOnePassengerIncludingTax: mockSitecoreField(
        'PayWithDepositDescriptionOnePassengerIncludingTax',
    ),

    PaymentImages: [],
    CvvInfo: mockSitecoreField(mockSitecoreImageField('cvvInfo.png')),
    CvvInfoAMEX: mockSitecoreField(mockSitecoreImageField('cvvInfoAMEX.png')),
    IssueNumberInfo: mockSitecoreField(mockSitecoreImageField('issueNumberInfo.png')),

    ProtectionImage: mockSitecoreField(mockSitecoreImageField('protectionImage.png')),
    ProtectionTitle: mockSitecoreField('ProtectionTitle'),

    IsUseCreditShown: mockSitecoreField(true),
    UseCreditTitle: mockSitecoreField('UseCreditTitle'),
    UseCreditDescription: mockSitecoreField('UseCreditDescription'),
    UseCreditFormTitle: mockSitecoreField('UseCreditFormTitle'),
    UseCreditLogInText: mockSitecoreField('UseCreditLogInText'),
    EnablePriceJumpInfoBox: mockSitecoreField(true),
    PriceDecreasedMessage: mockSitecoreField('PriceDecreasedMessage'),
    PriceIncreasedMessage: mockSitecoreField('PriceIncreasedMessage'),
    IconCreditInfoBlock: mockSitecoreField(mockSitecoreImageField('image.png')),
    TextCreditInfoBlock: mockSitecoreField('TextCreditInfoBlock'),
    LuggageInfoTitle: mockSitecoreField('LuggageInfoTitle'),
    PramName: mockSitecoreField('PramName'),
    SportEquipmentsLabel: mockSitecoreField('SportEquipmentsLabel'),
    PriceJumpPopupAccept: mockSitecoreField('PriceJumpPopupAccept'),
    PriceJumpPopupDecline: mockSitecoreField('PriceJumpPopupDecline'),
    PriceJumpPopupDescription: mockSitecoreField('description'),
    PriceJumpPopupTitle: mockSitecoreField('PriceJumpPopupTitle'),
    AmountLeftToPayWithApplePayToggleOn: mockSitecoreField('true'),
    TouristTaxPaymentRequiredBannerTitle: mockSitecoreField('TouristTaxPaymentRequiredBannerTitle'),
    TouristTaxPaymentRequiredBannerText: mockSitecoreField('TouristTaxPaymentRequiredBannerText'),
    TouristTaxNoPaymentRequiredBannerTitle: mockSitecoreField('TouristTaxNoPaymentRequiredBannerTitle'),
    TouristTaxNoPaymentRequiredBannerText: mockSitecoreField('TouristTaxNoPaymentRequiredBannerText'),
};

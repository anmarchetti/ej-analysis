import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PromocodeStatuses } from 'models/data/IPromocode';
import { ITransfer, ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ITransferFields } from 'frontend/components/renderings/Transfer/Transfer';

export const mockTransferFields: ITransferFields = {
    PrivateFeesDescription: mockSitecoreField('PrivateFeesDescription'),
    PrivateFeesTitle: mockSitecoreField('PrivateFeesTitle'),
    SharedFeesDescriptionPriceHidden: mockSitecoreField('SharedFeesDescriptionPriceHidden'),
    SingleSharedFeesDescription: mockSitecoreField(
        'Our transfer partner charges an additional {price} for each piece of sports equipment. This has been added to your total holiday cost.',
    ),
    MultipleSharedFeesDescription: mockSitecoreField(
        'Our transfer partner charges {priceSmall} per small and {priceLarge} per large item for accommodating your sport equipment.',
    ),
    SharedFeesTitle: mockSitecoreField('Additional fees included'),
    SERemoveTransferPopup: {
        fields: {
            Title: mockSitecoreField('Adding sports equipment will remove your transfer'),
            Description: mockSitecoreField(
                '<p>We’re sorry, but our shared transfer provider can’t accommodate sports equipment at this time.</p><p>You may add sports equipment, but we will remove your transfer on this booking.</p>',
            ),
            CancelButtonLabel: mockSitecoreField('Cancel'),
            ConfirmButtonLabel: mockSitecoreField('Add, but remove transfer'),
        },
        id: '1',
    },
    TransferRemoveSEPopup: {
        fields: {
            Title: mockSitecoreField('Changing your transfer will remove your sports equipment'),
            Description: mockSitecoreField(
                '<p>We’re sorry, but our shared transfer provider can’t accommodate sports equipment at this time.</p><p>If you select this transfer, we will remove your sports equipment.</p>',
            ),
            CancelButtonLabel: mockSitecoreField('Cancel'),
            ConfirmButtonLabel: mockSitecoreField('Change transfer anyway'),
        },
        id: '2',
    },
    LargeSERemoveTransferPopup: {
        fields: {
            Title: mockSitecoreField('Adding large sports equipment items will remove your transfer'),
            Description: mockSitecoreField(
                '<p>We’re sorry, but our shared transfer provider can’t accommodate large sports equipment items at this time.</p><p>You may add your large sports equipment item {selectedSport}, but we will remove your transfer on this booking.</p>',
            ),
            CancelButtonLabel: mockSitecoreField('Cancel'),
            ConfirmButtonLabel: mockSitecoreField('Add, but remove transfer'),
        },
        id: '3',
    },
    TransferRemoveLargeSEPopup: {
        fields: {
            Title: mockSitecoreField('Changing your transfer will remove your large sports equipment'),
            Description: mockSitecoreField(
                '<p>We’re sorry, but our shared transfer provider can’t accommodate large sports equipment at this time.</p><p>If you select this transfer, we will remove your large sports equipment {selectedSport}.</p>',
            ),
            CancelButtonLabel: mockSitecoreField('Cancel'),
            ConfirmButtonLabel: mockSitecoreField('Change transfer anyway'),
        },
        id: '4',
    },
    UpgradeForText: mockSitecoreField('UpgradeForText'),
    PrivateCTADescription: mockSitecoreField('PrivateCTADescription'),
    NoTransferCTADescription: mockSitecoreField('NoTransferCTADescription'),
    IncludedForFreeText: mockSitecoreField('IncludedForFreeText'),
    SharedCTADescription: mockSitecoreField('SharedCTADescription'),
    TransferNotAccommodatingSEPopup: {
        fields: {
            Title: mockSitecoreField("Votre transfert n'est pas adapté à l'équipement sportif"),
            Description: mockSitecoreField(
                "<p>Le prestataire de transfert de votre forfait de vacances n'est pas en mesure de prendre en charge les équipements sportifs, nous vous recommandons donc de changer pour un transfert privé. Vous pouvez également retirer votre équipement sportif.</p>",
            ),
            CancelButtonLabel: mockSitecoreField('Retirer mon équipement sportif'),
            ConfirmButtonLabel: mockSitecoreField('Garder mon équipement sportif'),
        },
        id: '4',
    },
    UpgradeForFree: mockSitecoreField('UpgradeForFree'),
};

export const mockTransfer: ITransfer = {
    id: 'TRANSFER001',
    autoInclude: true,
    code: 'TRANSFER_CODE',
    method: 'Shuttle',
    paxs: ['Passenger 1', 'Passenger 2'],
    prom: 'PROMO123',
    smallSeSurcharge: 20,
    largeSeSurcharge: 50,
    quantity: 1,
    rateRule: 'RATE_RULE',
    serviceStates: ['State 1', 'State 2'],
    setType: ['Set Type 1', 'Set Type 2'],
    startDate: '2023-06-01',
    typeCode: ['Type Code 1', 'Type Code 2'],
    name: 'Transfer Name',
    price: 50,
    pricePP: 25,
    type: TransferType.Private,
    content: 'Transfer details',
    iconUrl: 'https://example.com/transfer-icon.png',
    isHidden: false,
    transferInfo: {
        duration: 60,
        depInstr: 'Departure instructions',
        arrivalInstr: 'Arrival instructions',
    },
};

export const mockTransfers = [
    mockTransfer,
    {
        ...mockTransfer,
        id: 'TRANSFER002',
        type: TransferType.Shared,
        price: 20,
        pricePP: 10,
        smallSeSurcharge: 20,
        largeSeSurcharge: 50,
        transferInfo: { ...mockTransfer.transferInfo, duration: 120 },
    },
    {
        ...mockTransfer,
        id: 'TRANSFER003',
        type: TransferType.NoTransfer,
        price: 30,
        pricePP: 20,
        transferInfo: { ...mockTransfer.transferInfo, duration: 120 },
    },
];

export const mockTransferWithAmendmentCharges: ITransferWithAmendmentCharges = {
    transfer: mockTransfer,
    amendmentCharges: 13,
    promoCodeBreakDown: {
        due: 21,
        promoCodeStatus: PromocodeStatuses.TIER_UPGRADE,
        promoCode: 'promoCode',
    },
    errataFlightInfo: ['errataFlightInfo 1', 'errataFlightInfo 2'],
};

export const mockTransfersWithAmendmentCharges: ITransferWithAmendmentCharges[] = [
    mockTransferWithAmendmentCharges,
    {
        ...mockTransferWithAmendmentCharges,
        amendmentCharges: 0,
        transfer: {
            ...mockTransferWithAmendmentCharges.transfer,
            type: TransferType.NoTransfer,
            code: 'X9099191BERS',
            transferInfo: {
                duration: 30,
            },
        },
    },
];

export const mockAltSharedTransfer = {
    code: 'test1',
    type: TransferType.Shared,
    price: 100,
    transferInfo: {
        duration: 60,
    },
} as ITransfer;

export const mockAltPrivateTransfer = {
    code: 'test2',
    type: TransferType.Private,
    price: 200,
    transferInfo: {
        duration: 30,
    },
} as ITransfer;

export const mockAltNoTransfer = {
    code: 'test3',
    type: TransferType.NoTransfer,
    price: 100,
} as ITransfer;

export const mockAltTransfer = [mockAltSharedTransfer, mockAltPrivateTransfer, mockAltNoTransfer];

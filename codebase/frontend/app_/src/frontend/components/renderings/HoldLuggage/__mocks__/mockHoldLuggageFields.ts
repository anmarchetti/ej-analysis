import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISportEquipmentRestrictionSeasonFields } from 'models/data/IHoldLuggage';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { IHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/IHoldLuggageFields';

export const SportEquipmentRestrictedSeasons = {
    id: '1',
    fields: {
        RestrictionSeasonsList: [
            {
                id: '1969c9b5-bcef-4ea0-9e01-7bd4a1138de9',
                fields: {
                    StartDate: {
                        value: '2024-09-01T00:00:00Z',
                    },
                    EndDate: {
                        value: '2024-11-30T00:00:00Z',
                    },
                },
            } as ISitecoreChildren<ISportEquipmentRestrictionSeasonFields>,
        ],
    },
};

export const mockHoldLuggageFields: IHoldLuggageFields = {
    Title: mockSitecoreField('Title'),
    HoldLuggageAndSportsSubtitle: mockSitecoreField('HoldLuggageAndSportsSubtitle'),
    HoldLuggageSubtitle: mockSitecoreField('HoldLuggageSubtitle'),
    SportsSubtitle: mockSitecoreField('SportsSubtitleOnly'),
    OutboundAndReturnTextMultiple: mockSitecoreField('OutboundAndReturnTextMultiple'),
    OutboundAndReturnTextSingular: mockSitecoreField('OutboundAndReturnTextSingular'),
    OutlineBannerTextContent: mockSitecoreField('Add an extra cabin bag, and make sure you have everything you need!'),
    HoldLuggageAndSportHeading: mockSitecoreField('HoldLuggageAndSportHeading'),
    HoldLuggageHeading: mockSitecoreField('HoldLuggageHeading'),
    SportsHeading: mockSitecoreField('SportsHeading'),
    BagExtraDescription: mockSitecoreField('BagExtraDescription'),
    BagExtraSportDescription: mockSitecoreField('BagExtraSportDescription'),
    BagExtraPrice: mockSitecoreField('BagExtraPrice'),
    SportsExtraPrice: mockSitecoreField('SportsExtraPrice'),
    AddButtonText: mockSitecoreField('AddButtonText'),
    EditButtonText: mockSitecoreField('EditButtonText'),
    BagExtraIcon: mockSitecoreField(mockSitecoreImageField('BagExtraIcon')),
    OutboundAndReturnIcon: mockSitecoreField(mockSitecoreImageField('OutboundAndReturnIcon')),
    IncludedForFreeText: mockSitecoreField('IncludedForFreeText'),
    BagExtraDescriptionTrade: mockSitecoreField('BagExtraDescriptionTrade'),
    RequestFailureHeader: mockSitecoreField('RequestFailureHeader'),
    RequestFailureDescription: mockSitecoreField('RequestFailureDescription'),
    SportTitle: mockSitecoreField('SportTitle'),
    SportDescription: mockSitecoreField('SportDescription'),
    EditLabel: mockSitecoreField('EditLabel'),
    PramHeading: mockSitecoreField('PramHeading'),
    PramDescription: mockSitecoreField('PramDescription'),
    PramIcon: mockSitecoreField(mockSitecoreImageField('PramIcon')),
    SportEquipmentIcon: mockSitecoreField(mockSitecoreImageField('SportIcon')),
    InternalFlightHeader: mockSitecoreField('InternalFlightHeader'),
    InternalFlightDescription: mockSitecoreField('InternalFlightDescription'),
    UnavailableMessageHeader: mockSitecoreField('UnavailableMessageHeader'),
    UnavailableMessageDescription: mockSitecoreField('UnavailableMessageDescription'),
    RequestFailureAltSubtitle: mockSitecoreField('RequestFailureAltSubtitle'),
    NoDefaultBagsSubtitle: mockSitecoreField('NoDefaultBagsSubtitle'),
    SportTransferFees: mockSitecoreField('(excl. transfer costs)'),
    NoAddHeading: mockSitecoreField('NoAddHeading'),
    HoldLuggageLuxurySubtitle: mockSitecoreField('HoldLuggageLuxurySubtitle'),
    ExtraBagsAndSportsNotAvailable: mockSitecoreField('ExtraBagsAndSportsNotAvailable'),
    SportEquipmentRestrictedSeasons,
};

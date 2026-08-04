import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { TSitecoreMultiList } from 'models/sitecore/generic/ISitecoreField';
import { IClaimFormFields, IClaimFormItemFields } from 'frontend/components/renderings/ClaimForm/interfaces';

export const eligibleItemsMock: TSitecoreMultiList<IClaimFormItemFields> = [
    {
        fields: {
            ItemText: mockSitecoreField('Eligible Item 1'),
            ItemTooltip: mockSitecoreField('Tooltip for Eligible Item 1'),
        },
        id: 'eligible-item-1',
    },
    {
        fields: {
            ItemText: mockSitecoreField('Eligible Item 2'),
            ItemTooltip: mockSitecoreField('Tooltip for Eligible Item 2'),
        },
        id: 'eligible-item-2',
    },
    {
        fields: {
            ItemText: mockSitecoreField('Eligible Item 3'),
            ItemTooltip: mockSitecoreField('Tooltip for Eligible Item 3'),
        },
        id: 'eligible-item-3',
    },
];

export const claimFormFieldsMock: IClaimFormFields = {
    EligibleItems: eligibleItemsMock,
    EligibleItemsDescription: mockSitecoreField('Description for eligible items.'),
    EligibleItemsSectionTitle: mockSitecoreField('Eligible Items'),
    EnableFullOverviewPopup: mockSitecoreField(true),
    FullOverviewPopupDescription: mockSitecoreField('FullOverview popup description.'),
    FullOverviewPopupIcon: mockSitecoreField(mockSitecoreImageField('/overview-popup-icon.png', 'Overview Popup Icon')),
    FullOverviewPopupTitle: mockSitecoreField('FullOverview Popup'),
    FormIcon: mockSitecoreField(mockSitecoreImageField('/form-icon.png', 'Form Icon')),
    FormTitle: mockSitecoreField('Claim Form Title'),
    InstructionsSectionDescription: mockSitecoreField('Instructions description.'),
    InstructionsSectionTitle: mockSitecoreField('Instructions'),
    NotEligibleItems: [
        {
            fields: {
                ItemText: mockSitecoreField('Not Eligible Item 1'),
                ItemTooltip: mockSitecoreField('Tooltip NE1'),
            },
            id: 'not-eligible-item-1',
        },
        {
            fields: {
                ItemText: mockSitecoreField('Not Eligible Item 2'),
                ItemTooltip: mockSitecoreField('Tooltip NE2'),
            },
            id: 'not-eligible-item-2',
        },
    ],
    NotEligibleItemsDescription: mockSitecoreField('Description for not eligible items.'),
    NotEligibleItemsSectionTitle: mockSitecoreField('Not Eligible Items'),
    OpenFormButtonLabel: mockSitecoreField('Open Form'),
    OpenFormButtonLink: mockSitecoreField(mockSitecoreLinkField('/open-form', 'Open Form')),
    SeeFullOverviewButtonLabel: mockSitecoreField('See FullOverview'),
    InstructionsSectionAdditionalDescription: mockSitecoreField('Additional instructions description.'),
};

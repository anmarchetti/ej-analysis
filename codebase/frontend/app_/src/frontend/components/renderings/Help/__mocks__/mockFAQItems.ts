import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import { ICategoriesSitecoreItem } from 'frontend/components/renderings/Help/FAQ';

export const mockFAQItems: ICategoriesSitecoreItem[] = [
    {
        id: 'd39b1eb5-9cd4-4146-8ba4-927a04048bb5',
        fields: {
            Questions: [
                {
                    id: 'a9a77ac3-ab5f-4a54-8774-cabb1296134c',
                    fields: {
                        Question: mockSitecoreField('How do I book my holiday?'),
                        Answer: mockSitecoreField('With us of course'),
                        NavigationParameter: mockSitecoreField('book'),
                    },
                    params: {},
                    rendering: {},
                },
                {
                    id: '6097b23d-5e19-4148-9063-9f476a75f5a6',
                    fields: {
                        Question: mockSitecoreField('What’s included on an easyJet holidays package?'),
                        Answer: mockSitecoreField('All beach holiday bookings with easyJet holidays'),
                        NavigationParameter: mockSitecoreField('included'),
                    },
                    params: {},
                    rendering: {},
                },
            ],
            CategoryTitle: mockSitecoreField('Booking your holiday'),
            NavigationParameter: mockSitecoreField('booking'),
        },
    },
    {
        id: '8a7a6f1c-b05b-4728-960f-35eb002f3ec9',
        fields: {
            Questions: [
                {
                    id: '81d1a802-2d3d-409d-aea9-c19c77f6a3f5',
                    fields: {
                        Question: mockSitecoreField('How do I pay off my holiday balance?'),
                        Answer: mockSitecoreField('To make a payment'),
                        NavigationParameter: mockSitecoreField('paybalance'),
                    },
                    params: {},
                    rendering: {},
                },
                {
                    id: 'b873dd97-d01e-4df8-a70a-17a59df955c4',
                    fields: {
                        Question: mockSitecoreField('My payment isnt going through online'),
                        Answer: mockSitecoreField('receiving an error code when attempting to pay online'),
                        NavigationParameter: mockSitecoreField('paymenterror'),
                    },
                    params: {},
                    rendering: {},
                },
            ],
            CategoryTitle: mockSitecoreField('Paying for your holiday and using easyJet holidays credit'),
            NavigationParameter: mockSitecoreField('payment'),
        },
    },
];

export const mockFaqTabItems: ITabItem[] = [
    {
        id: 'd39b1eb5-9cd4-4146-8ba4-927a04048bb5',
        TitleTab: mockSitecoreField('Booking your holiday'),
    },
    {
        id: '8a7a6f1c-b05b-4728-960f-35eb002f3ec9',
        TitleTab: mockSitecoreField('Paying for your holiday and using easyJet holidays credit'),
    },
];
export const mockQuestionItems: ITabItem[] = [
    {
        id: 'a9a77ac3-ab5f-4a54-8774-cabb1296134c',
        TitleTab: mockSitecoreField('How do I book my holiday?'),
        ContentTab: mockSitecoreField('With us of course'),
    },
    {
        id: '6097b23d-5e19-4148-9063-9f476a75f5a6',
        TitleTab: mockSitecoreField('What’s included on an easyJet holidays package?'),
        ContentTab: mockSitecoreField('All beach holiday bookings with easyJet holidays'),
    },
];

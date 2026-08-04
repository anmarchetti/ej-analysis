import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import { IAlertInformationBlockItem } from 'frontend/components/renderings/AlertInformation/AlertInformation';

export const mockAlertsInformationSitecore: IAlertInformationBlockItem[] = [
    {
        id: '1',
        fields: {
            Anchor: mockSitecoreField('first'),
            Answer: mockSitecoreField('answer'),
            Question: mockSitecoreField('question'),
        },
        params: {},
        rendering: {},
    },
    {
        id: '2',
        fields: {
            Anchor: mockSitecoreField('second'),
            Answer: mockSitecoreField('second answer'),
            Question: mockSitecoreField('second question'),
        },
        params: {},
        rendering: {},
    },
];

export const mockAlertsItems: ITabItem[] = [
    {
        id: '1',
        ContentTab: mockSitecoreField('answer'),
        TitleTab: mockSitecoreField('question'),
    },
    {
        id: '2',
        ContentTab: mockSitecoreField('second answer'),
        TitleTab: mockSitecoreField('second question'),
    },
];

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IQuestionAnswerSitecoreItem } from 'models/data/IQuestionAnswerFields';
import { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';

export const mockSitecoreItems: IQuestionAnswerSitecoreItem[] = [
    {
        fields: {
            Question: mockSitecoreField('#1 Question'),
            Answer: mockSitecoreField('#1 Answer'),
        },
        id: '1',
        params: {},
        rendering: {},
    },
    {
        fields: {
            Question: mockSitecoreField('#2 Question'),
            Answer: mockSitecoreField('#2 Answer'),
        },
        id: '2',
        params: {},
        rendering: {},
    },
];

export const tabAccordionItems: ITabItem[] = [
    {
        TitleTab: mockSitecoreField('#1 Question'),
        ContentTab: mockSitecoreField('#1 Answer'),
        id: '1',
    },
    {
        TitleTab: mockSitecoreField('#2 Question'),
        ContentTab: mockSitecoreField('#2 Answer'),
        id: '2',
    },
];

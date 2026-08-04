import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import { IQuestionAnswerSitecoreItem } from 'frontend/components/renderings/QuestionAndAnswer/QuestionAndAnswer';

export const questionAndAnswerMocks: IQuestionAnswerSitecoreItem[] = [
    {
        fields: {
            Question: mockSitecoreField('#1 Question'),
            Answer: mockSitecoreField('#1 Answer'),
            NavigationParameter: mockSitecoreField('nav 1'),
        },
        id: '1',
        params: {},
        rendering: {},
    },
    {
        fields: {
            Question: mockSitecoreField('#2 Question'),
            Answer: mockSitecoreField('#2 Answer'),
            NavigationParameter: mockSitecoreField('nav 2'),
        },
        id: '2',
        params: {},
        rendering: {},
    },
];

export const mockQuestionAndAnswerItems: ITabItem[] = [
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

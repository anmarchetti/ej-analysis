import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockFAQItems, mockQuestionItems } from 'frontend/components/renderings/Help/__mocks__/mockFAQItems';
import { mockFAQRatingFields } from 'frontend/components/renderings/Help/__mocks__/mockFAQRatingFields';
import QuestionsAnswers, {
    IQuestionsAnswersProps,
} from 'frontend/components/renderings/Help/components/QuestionsAnswers/QuestionsAnswers';

const createProps = (): IQuestionsAnswersProps => ({
    category: mockFAQItems[0],
    faqRatingFields: mockFAQRatingFields,
});

const createStores = () =>
    createMockStores({
        queryParamStore: { helpCategory: '', helpQuestion: '' },
        routerStore: { redirectToQuestion: jest.fn() },
        trackingStore: { trackHelpCentreClick: jest.fn() },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/TabAccordion/utils/tabAccordion.utils', () => ({
    getTabItems: () => mockQuestionItems,
}));

const mockTabAccordionCollapseProps = jest.fn();
jest.mock('frontend/components/common/TabAccordion/components/TabAccordionCollapse/TabAccordionCollapse', () => ({
    __esModule: true,
    default: props => {
        mockTabAccordionCollapseProps(props);

        return (
            <div data-tid={`tab-accordion-collapse-${props.tab.id}`}>
                <button onClick={() => props.onTabClick(props.tab)} data-tid={`tab-button-${props.tab.id}`} />
                {props.renderContent(props.tab)}
            </div>
        );
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockFaqRatingProps = jest.fn();
jest.mock('frontend/components/renderings/Help/components/FaqRating/FaqRating', () => ({
    __esModule: true,
    default: props => {
        mockFaqRatingProps(props);

        return <div data-tid='faq-rating' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

describe('<QuestionsAnswers />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render all question', () => {
        const { container } = render(<QuestionsAnswers {...mockProps} />);

        expect(screen.getByTestId('questions-answers-container')).toBeInTheDocument();
        expect(screen.getByTestId('category-title')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.category.fields.CategoryTitle,
            tag: 'div',
            className: 'title',
            'data-tid': 'category-title',
        });

        mockQuestionItems.forEach(question => {
            expect(container.querySelector('.contentContainer.active')).not.toBeInTheDocument();
            expect(screen.getByTestId(`tab-accordion-collapse-${question.id}`)).toBeInTheDocument();

            expect(mockTabAccordionCollapseProps).toHaveBeenCalledWith({
                tab: question,
                isOpened: false,
                onTabClick: expect.any(Function),
                renderContent: expect.any(Function),
                scrollIntoView: true,
                tabCollapseBtnClassName: 'tabCollapseButton',
                tabCollapseBtnSelectedClassName: 'tabCollapseButtonSelected',
                tabCollapseClassName: 'tabCollapse',
            });
        });
    });

    it('should render question content when it is selected', async () => {
        render(<QuestionsAnswers {...mockProps} />);

        const { id, fields: { Answer, Question, NavigationParameter } = {} } = mockProps.category.fields.Questions[0];
        await userEvent.click(screen.getByTestId(`tab-button-${id}`));

        expect(screen.getAllByTestId('answer-content-container')[0]).toBeInTheDocument();
        expect(screen.getAllByTestId('rich-text-with-links')[0]).toBeInTheDocument();
        expect(screen.getByTestId('faq-rating')).toBeInTheDocument();

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: Answer,
            className: 'content',
        });

        expect(mockFaqRatingProps).toHaveBeenCalledWith({
            fields: mockProps.faqRatingFields,
            questionId: id,
            categoryNavParameter: mockProps.category.fields.NavigationParameter.value,
            questionNavParameter: NavigationParameter?.value,
            questionName: Question?.value,
            categoryName: mockProps.category.fields.CategoryTitle.value,
        });
    });

    describe('renderContent', () => {
        it('should render answer content with correct data-tid', async () => {
            render(<QuestionsAnswers {...mockProps} />);

            const { id, fields: { Answer } = {} } = mockProps.category.fields.Questions[0];
            await userEvent.click(screen.getByTestId(`tab-button-${id}`));

            const answerContainer = screen.getAllByTestId('answer-content-container')[0];
            expect(answerContainer).toBeInTheDocument();
            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: Answer,
                className: 'content',
            });
        });

        it('should apply active class when question is selected', async () => {
            const { container } = render(<QuestionsAnswers {...mockProps} />);

            const { id } = mockProps.category.fields.Questions[0];
            await userEvent.click(screen.getByTestId(`tab-button-${id}`));

            const activeAnswerContainers = container.querySelectorAll('.contentContainer.active');
            expect(activeAnswerContainers).toHaveLength(1);
        });

        it('should NOT apply active class when question is not selected', () => {
            render(<QuestionsAnswers {...mockProps} />);

            const { renderContent: renderContentFn } = mockTabAccordionCollapseProps.mock.calls[0][0];
            const firstQuestion = mockQuestionItems[0];

            const result = renderContentFn(firstQuestion as any);

            // Simulate rendering to check if active class is not applied
            const { container } = render(result);
            expect(container.querySelector('.active')).not.toBeInTheDocument();
        });

        it('should render FaqRating only when question is selected', async () => {
            render(<QuestionsAnswers {...mockProps} />);

            const { id } = mockProps.category.fields.Questions[0];

            // Before click - FaqRating should not be rendered
            expect(screen.queryByTestId('faq-rating')).not.toBeInTheDocument();

            // After click - FaqRating should be rendered
            await userEvent.click(screen.getByTestId(`tab-button-${id}`));
            expect(screen.getByTestId('faq-rating')).toBeInTheDocument();
        });

        it('should pass correct props to FaqRating when question is selected', async () => {
            render(<QuestionsAnswers {...mockProps} />);

            const questionIndex = 1;
            const { id, fields: { NavigationParameter, Question } = {} } =
                mockProps.category.fields.Questions[questionIndex];

            await userEvent.click(screen.getByTestId(`tab-button-${id}`));

            expect(mockFaqRatingProps).toHaveBeenCalledWith({
                fields: mockProps.faqRatingFields,
                questionId: id,
                categoryNavParameter: mockProps.category.fields.NavigationParameter.value,
                questionNavParameter: NavigationParameter?.value,
                questionName: Question?.value,
                categoryName: mockProps.category.fields.CategoryTitle.value,
            });
        });

        it('should render correct answer for each question', async () => {
            render(<QuestionsAnswers {...mockProps} />);

            const firstQuestion = mockProps.category.fields.Questions[0];
            const secondQuestion = mockProps.category.fields.Questions[1];

            // Click first question
            await userEvent.click(screen.getByTestId(`tab-button-${firstQuestion.id}`));
            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: firstQuestion.fields?.Answer,
                className: 'content',
            });

            const firstCallCount = mockRichTextWithLinksProps.mock.calls.length;

            // Click second question
            await userEvent.click(screen.getByTestId(`tab-button-${secondQuestion.id}`));
            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: secondQuestion.fields?.Answer,
                className: 'content',
            });

            expect(mockRichTextWithLinksProps.mock.calls.length).toBeGreaterThan(firstCallCount);
        });
    });
});

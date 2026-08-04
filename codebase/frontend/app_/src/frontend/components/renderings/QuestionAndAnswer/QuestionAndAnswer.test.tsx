import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import { mockQuestionAndAnswerItems, questionAndAnswerMocks } from './__mocks__/questionAndAnswerItems';
import { QUESTION_AND_ANSWERS_ANCHOR_ID, QuestionAndAnswer, TQuestionAndAnswerProps } from './QuestionAndAnswer';

const createProps = (): TQuestionAndAnswerProps => ({
    fields: {
        items: questionAndAnswerMocks,
    },
    params: {},
    rendering: {},
});
const createStores = () =>
    createMockStores({
        queryParamStore: { helpQuestion: '' },
        routerStore: { redirectToQuestion: jest.fn() },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/TabAccordion/utils/tabAccordion.utils', () => ({
    getTabItems: () => mockQuestionAndAnswerItems,
}));

const mockTabAccordionProps = jest.fn();
jest.mock('frontend/components/common/TabAccordion/TabAccordion', () => ({
    __esModule: true,
    default: props => {
        mockTabAccordionProps(props);

        return (
            <div data-tid='tab-accordion'>
                {props.items.map(item => (
                    <button
                        data-tid={`tab-button-${item.id}`}
                        key={item.id}
                        onClick={() => {
                            props.onTabClick(item);
                        }}
                    />
                ))}
                {props.renderContent(props.items[0])}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: () => <div data-tid='rich-text-with-links' />,
}));

let mockIsMoreThenTabletScreen = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenTabletViewport: jest.fn(() => mockIsMoreThenTabletScreen),
}));

describe('QuestionAndAnswer', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render component when fields are NOT provided', () => {
        delete mockProps.fields;

        const { container } = render(<QuestionAndAnswer {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when sitecore items are NOT provided', () => {
        mockProps.fields!.items = [];

        const { container } = render(<QuestionAndAnswer {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        render(<QuestionAndAnswer {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();
        expect(mockTabAccordionProps).toHaveBeenCalledWith({
            id: QUESTION_AND_ANSWERS_ANCHOR_ID,
            renderContent: expect.any(Function),
            items: mockQuestionAndAnswerItems,
            tabAccordionClassName: 'wrapper',
            scrollIntoView: false,
            tabToggleClassName: 'toggleBtn',
            tabToggleSelectedClassName: 'toggleBtnSelected',
            onTabClick: expect.any(Function),
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
    });

    it('should render component with default tab selected', () => {
        mockStores.queryParamStore.helpQuestion = 'nav 1';
        render(<QuestionAndAnswer {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();
        expect(mockTabAccordionProps).toHaveBeenCalledWith({
            id: QUESTION_AND_ANSWERS_ANCHOR_ID,
            renderContent: expect.any(Function),
            items: mockQuestionAndAnswerItems,
            tabAccordionClassName: 'wrapper',
            scrollIntoView: false,
            tabToggleClassName: 'toggleBtn',
            tabToggleSelectedClassName: 'toggleBtnSelected',
            defaultSelectedTabId: '1',
            onTabClick: expect.any(Function),
        });
    });

    it('should add withoutMarginTop class when ZeroMarginParam is set', () => {
        mockProps.params.ZeroMargin = '1';
        render(<QuestionAndAnswer {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();
        expect(mockTabAccordionProps).toHaveBeenCalledWith({
            id: QUESTION_AND_ANSWERS_ANCHOR_ID,
            renderContent: expect.any(Function),
            items: mockQuestionAndAnswerItems,
            tabAccordionClassName: 'wrapper withoutMargin',
            scrollIntoView: false,
            tabToggleClassName: 'toggleBtn',
            tabToggleSelectedClassName: 'toggleBtnSelected',
            defaultSelectedTabId: undefined,
            onTabClick: expect.any(Function),
        });
    });

    it('calls redirect to question function when tab is clicked', async () => {
        render(<QuestionAndAnswer {...mockProps} />);

        await userEvent.click(screen.getByTestId('tab-button-1'));

        expect(mockStores.routerStore.redirectToQuestion).toHaveBeenCalledWith(undefined, 'nav 1');
    });

    it('should deselect tab and call redirectToQuestion without params when clicking selected tab on mobile', async () => {
        mockIsMoreThenTabletScreen = false;

        render(<QuestionAndAnswer {...mockProps} />);

        // First click to select a tab
        await userEvent.click(screen.getByTestId('tab-button-1'));
        expect(mockStores.routerStore.redirectToQuestion).toHaveBeenCalledWith(undefined, 'nav 1');

        // Clear previous calls
        mockStores.routerStore.redirectToQuestion.mockClear();

        // Click the same tab again to deselect it
        await userEvent.click(screen.getByTestId('tab-button-1'));

        // Should call redirectToQuestion without any parameters (deselect action)
        expect(mockStores.routerStore.redirectToQuestion).toHaveBeenCalledWith();
    });

    it('should select new tab and call redirectToQuestion with navigation param when clicking different tab', async () => {
        mockIsMoreThenTabletScreen = false;

        render(<QuestionAndAnswer {...mockProps} />);

        // First click to select first tab
        await userEvent.click(screen.getByTestId('tab-button-1'));
        expect(mockStores.routerStore.redirectToQuestion).toHaveBeenCalledWith(undefined, 'nav 1');

        // Clear previous calls
        mockStores.routerStore.redirectToQuestion.mockClear();

        // Click second tab to select it instead
        await userEvent.click(screen.getByTestId('tab-button-2'));

        // Should call redirectToQuestion with the second tab's navigation parameter
        expect(mockStores.routerStore.redirectToQuestion).toHaveBeenCalledWith(undefined, 'nav 2');
    });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import QuestionFooter, { IQuestionFooterProps } from './QuestionFooter';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockProps;
let mockStores;

const createMockProps = (): IQuestionFooterProps => ({
    onBackClick: jest.fn(),
    onNextClick: jest.fn(),
    isNextButtonDisabled: false,
    isBackButtonDisabled: false,
});

describe('disabling next button', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            inspireMeStore: {
                isNextButtonLoading: false,
                isPrevButtonLoading: false,
            },
        });
    });

    it('next button should be clickable when not disabled ', () => {
        render(<QuestionFooter {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-next-question'));

        expect(mockProps.onNextClick).toBeCalled();
    });

    it('next button should NOT be clickable when disabled ', () => {
        mockProps.isNextButtonDisabled = true;
        render(<QuestionFooter {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-next-question'));

        expect(mockProps.onNextClick).not.toBeCalled();
    });

    it('back button should NOT be clickable when disabled ', () => {
        mockProps.isBackButtonDisabled = true;
        render(<QuestionFooter {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-prev-question'));

        expect(mockProps.onBackClick).not.toBeCalled();
    });

    it('should render button titles from props', () => {
        mockProps.prevButtonText = 'Previous';
        mockProps.nextButtonText = 'Next';

        render(<QuestionFooter {...mockProps} />);

        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should render default buttons text when there is no titles in props', () => {
        render(<QuestionFooter {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsBack)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsButtonsContinue)).toBeInTheDocument();
    });

    it('should render data-tid', () => {
        render(<QuestionFooter {...mockProps} />);

        expect(screen.getByTestId('inspire-me-footer')).toBeInTheDocument();
    });
});

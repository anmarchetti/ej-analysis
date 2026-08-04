import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import FinalQuizTab, { TFinalQuizTabProps } from 'frontend/components/renderings/FinalQuizTab/FinalQuizTab';

expect.extend(toHaveNoViolations);

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='text'>{field.value}</div>,
    RichText: ({ field }) => <div data-tid='rich-text'>{field.value}</div>,
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='icon'>{field.value.src}</div>,
}));

jest.mock('frontend/components/common/FlyingPlaneAnimation/FlyingPlaneAnimation', () => ({
    __esModule: true,
    default: () => <div data-tid='flying-plane-animation' />,
}));

const mockedQuestionFooter = jest.fn();
jest.mock('frontend/components/common/InspireMeQuestionFooter/QuestionFooter', () => ({
    __esModule: true,
    default: props => {
        mockedQuestionFooter(props);

        return <div data-tid='question-footer' />;
    },
}));

const createProps = (): TFinalQuizTabProps => ({
    fields: {
        Description: mockSitecoreField('Description'),
        Title: mockSitecoreField('Title'),
        HeaderIconLoader: mockSitecoreField(mockSitecoreImageField('src')),
        HeaderImageLoader: [
            {
                fields: {
                    Image: mockSitecoreField(mockSitecoreImageField('src-1')),
                },
                id: '1',
            },
            {
                fields: {
                    Image: mockSitecoreField(mockSitecoreImageField('src-2')),
                },
                id: '1',
            },
        ],
    },
    params: {},
    rendering: {
        componentName: StaticQuestionTitle.FinalScreen,
    },
});

let mockProps;

describe('FinalQuizTab', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render content', () => {
        render(<FinalQuizTab {...mockProps} />);

        expect(screen.getByTestId('icon')).toHaveTextContent(mockProps.fields.HeaderIconLoader.value.src);
        expect(screen.getByText(mockProps.fields.Description.value)).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.Title.value)).toBeInTheDocument();
        expect(screen.getByTestId('flying-plane-animation')).toBeInTheDocument();
    });

    it('should NOT render content if there are no fields', () => {
        mockProps.fields = null;
        const { container } = render(<FinalQuizTab {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render footer with disabled buttons', () => {
        render(<FinalQuizTab {...mockProps} />);

        expect(screen.getByTestId('question-footer')).toBeInTheDocument();
        expect(mockedQuestionFooter).toHaveBeenCalledWith({ isNextButtonDisabled: true, isBackButtonDisabled: true });
    });

    it('should pass accessibility', async () => {
        const { container } = render(<FinalQuizTab {...mockProps} />);
        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should change active index every 500 milliseconds', async () => {
        jest.useFakeTimers();

        render(<FinalQuizTab {...mockProps} />);

        const images = screen.getAllByRole('img');

        expect(images[0]).toHaveClass('activeSlide');

        for (let i = 0; i < images.length - 1; i++) {
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(images[i]).not.toHaveClass('activeSlide');
            expect(images[i + 1]).toHaveClass('activeSlide');
        }

        // fake timer for last image
        act(() => {
            jest.advanceTimersByTime(500);
        });
        expect(images[images.length - 1]).not.toHaveClass('activeSlide');
        expect(images[0]).toHaveClass('activeSlide');
    });
});

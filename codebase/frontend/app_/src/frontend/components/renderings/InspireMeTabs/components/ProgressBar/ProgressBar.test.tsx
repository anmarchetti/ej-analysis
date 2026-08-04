import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { DynamicQuestionTitle, StaticQuestionTitle } from 'models/enum/InspireMeQuiz';

import ProgressBar, { IProgressBar } from './ProgressBar';

expect.extend(toHaveNoViolations);

jest.mock('react-countup', () => ({ start, end, className }) => (
    <div className={className} data-tid='react-countup'>{`${start}->${end}`}</div>
));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IProgressBar => ({
    fields: {
        ProgressTitle: mockSitecoreField('ProgressTitle'),
        ProgressSubtitle: mockSitecoreField('ProgressSubtitle'),
    },
});

let mockProps;
let mockStores;

describe('ProgressBar component', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            inspireMeStore: {
                quizTabsData: [
                    {
                        isShownOnProgressBar: true,
                        progressBarTitle: `progress-bar-title${DynamicQuestionTitle.DepartureAirport}`,
                        title: DynamicQuestionTitle.DepartureAirport,
                    },
                    {
                        isShownOnProgressBar: true,
                        progressBarTitle: `progress-bar-title${DynamicQuestionTitle.TravelGroup}`,
                        title: DynamicQuestionTitle.TravelGroup,
                    },
                    {
                        isShownOnProgressBar: false,
                        progressBarTitle: `progress-bar-title${StaticQuestionTitle.StartScreen}`,
                        title: StaticQuestionTitle.StartScreen,
                    },
                ],
                percentageOfPassedQuestions: 0,
                activeQuestionIndex: 1,
            },
        });
    });

    it('should render only questions that showed in progress bar', () => {
        render(<ProgressBar {...mockProps} />);

        expect(screen.getByTestId(`progress-bar-title${DynamicQuestionTitle.DepartureAirport}`)).toHaveTextContent(
            `1progress-bar-title${DynamicQuestionTitle.DepartureAirport}`,
        );
        expect(screen.getByTestId(`progress-bar-title${DynamicQuestionTitle.TravelGroup}`)).toHaveTextContent(
            `2progress-bar-title${DynamicQuestionTitle.TravelGroup}`,
        );
        expect(screen.queryByTestId(`progress-bar-title${StaticQuestionTitle.StartScreen}`)).not.toBeInTheDocument();
    });

    it('should count percentage of answered questions', () => {
        mockStores.inspireMeStore.percentageOfPassedQuestions = 50;
        render(<ProgressBar {...mockProps} />);

        expect(screen.getByTestId('react-countup')).toHaveClass('data-tid-progress-bar-percentage');
        expect(screen.getByTestId('react-countup')).toHaveTextContent('0->50');
    });

    it('should show 0% when user open start screen to avoid blinking of passing percentage when user back to repeat test ', () => {
        mockStores.inspireMeStore.percentageOfPassedQuestions = 50;
        mockStores.inspireMeStore.activeQuestionIndex = 0;
        render(<ProgressBar {...mockProps} />);

        expect(screen.getByTestId('react-countup')).toHaveTextContent('0->0');
    });

    it('should pass accessibility', async () => {
        const { container } = render(<ProgressBar {...mockProps} />);
        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should render data-tid', () => {
        render(<ProgressBar {...mockProps} />);

        expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });
});

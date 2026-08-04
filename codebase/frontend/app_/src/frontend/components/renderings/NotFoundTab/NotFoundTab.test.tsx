import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import NotFoundTab, { TNotFoundTabProps } from './NotFoundTab';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    RichText: ({ field, 'data-tid': dataTid }) => <div data-tid={dataTid}>{field.value}</div>,
    Placeholder: ({ renderEach }) => {
        const MockComponent = props => <div {...props} />;

        const mockComponent = (
            <MockComponent
                fields={{
                    CTAUrl: { value: { href: 'test-link' } },
                    CTAText: { value: 'Next' },
                }}
            />
        );

        return <div data-tid='placeholder'>{renderEach(mockComponent)}</div>;
    },
}));

jest.mock('frontend/components/common/InspireMeQuestionFooter/QuestionFooter', () => props => (
    <div data-tid='question-footer'>
        <button data-tid='question-footer-next-button' onClick={props.onNextClick} />
    </div>
));

const createProps = (): TNotFoundTabProps => ({
    fields: {
        Subtitle: mockSitecoreField('Subtitle'),
        Title: mockSitecoreField('Title'),
        EditQuizCTAText: mockSitecoreField('EditQuizCTAText'),
    },
    params: {},
    rendering: {},
});

let mockProps;
let mockStores;

describe('NotFoundTab', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            routerStore: {
                redirectTo: jest.fn(),
            },
            inspireMeStore: {
                setActiveStaticTabByTitle: jest.fn(),
            },
        });
    });

    it('should render content', () => {
        render(<NotFoundTab {...mockProps} />);

        expect(screen.getByText('Subtitle')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(screen.getByTestId('question-footer')).toBeInTheDocument();
    });

    it('should render with correct data-tid attributes', () => {
        render(<NotFoundTab {...mockProps} />);

        expect(screen.getByTestId('not-found-tab-title')).toHaveTextContent('Title');
        expect(screen.getByTestId('not-found-tab-subtitle')).toHaveTextContent('Subtitle');
    });

    it('should call redirectTo if buttonLink is passed', () => {
        render(<NotFoundTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('question-footer-next-button'));

        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith('test-link');
    });
});

import * as React from 'react';
import { render, screen } from '@testing-library/react';

import CustomerFeedbackCard from './CustomerFeedbackCard';

const createProps = () => ({
    item: {
        rating: 3,
        title: 'test',
        text: 'test',
        date: 'test',
    },
    showTitleAndComment: true,
});

let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<CustomerFeedbackCard />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should render rating', () => {
        render(<CustomerFeedbackCard {...props} />);

        expect(screen.getByTestId('feedback-card-rating')).toBeInTheDocument();
    });

    it('Should render content', () => {
        render(<CustomerFeedbackCard {...props} />);

        expect(screen.getByTestId('feedback-card-title')).toBeInTheDocument();
        expect(screen.getByTestId('feedback-card-text')).toBeInTheDocument();
        expect(screen.getByTestId('feedback-card-date')).toBeInTheDocument();
    });

    it('Should not render title and comment if has spec props', () => {
        props.showTitleAndComment = false;
        render(<CustomerFeedbackCard {...props} />);

        expect(screen.queryByTestId('feedback-card-title')).not.toBeInTheDocument();
        expect(screen.queryByTestId('feedback-card-text')).not.toBeInTheDocument();
    });
});

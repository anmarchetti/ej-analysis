import React from 'react';
import { render, screen } from '@testing-library/react';

import Card from './Card';

describe('<Card />', () => {
    const resetMocks = () => ({
        children: 'test',
        selected: false,
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Card should render', () => {
        it('Should standard render', () => {
            const { container } = render(<Card {...mocks} />);

            expect(screen.getByText('test')).toBeInTheDocument();
            expect(container.querySelector('.card')).toBeInTheDocument();
        });

        it('Should render with selected className and data-tid', () => {
            mocks.selected = true;
            mocks.dataTid = 'test-id';
            render(<Card {...mocks} />);

            expect(screen.getByText('test')).toBeInTheDocument();
            expect(screen.getByTestId('test-id')).toHaveClass('card--selected');
        });
    });
});

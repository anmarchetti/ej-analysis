import { render, screen } from '@testing-library/react';

import NumberOfHotelsTitle from './NumberOfHotelsTitle';

import '@testing-library/jest-dom';

let mockProps;

describe('NumberOfHotelsTitle', () => {
    beforeEach(() => {
        mockProps = {
            className: 'test-class',
            title: 'Test Title',
            isLoading: false,
            shimmerClassName: 'shimmer-class',
        };
    });

    it('should render loading shimmer when isLoading is true', () => {
        render(<NumberOfHotelsTitle {...mockProps} isLoading />);

        expect(screen.getByTestId('skeleton-number-of-hotels-title')).toBeInTheDocument();
    });

    it('should render title when isLoading is false', () => {
        render(<NumberOfHotelsTitle {...mockProps} />);

        const textElement = screen.getByText('Test Title');
        expect(textElement).toBeInTheDocument();
        expect(textElement.tagName).toBe('H3');
        expect(textElement).toHaveClass('test-class');
    });
});

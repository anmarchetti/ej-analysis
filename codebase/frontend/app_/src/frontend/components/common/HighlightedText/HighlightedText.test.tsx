import React from 'react';
import { render } from '@testing-library/react';

import { HighlightedText, IHighlightedTextProps } from './HighlightedText';

describe('<HighlightedText />', () => {
    const resetMocks = () => ({
        text: 'Budapest City',
        filterValue: 'Budapest',
    });

    let mockProps: IHighlightedTextProps;

    beforeEach(() => {
        mockProps = resetMocks();
    });

    it('should return name when filter does not match', () => {
        mockProps.filterValue = 'XYZ';

        const { container } = render(<HighlightedText {...mockProps} />);

        expect(container.innerHTML).toBe('Budapest City');
    });

    it('should handle empty name', () => {
        mockProps.text = '';
        mockProps.filterValue = 'XYZ';

        const { container } = render(<HighlightedText {...mockProps} />);

        expect(container.innerHTML).toBe('');
    });

    it('should highlight filter value with <b> tag when filter is substring of name', () => {
        const { container } = render(<HighlightedText {...mockProps} />);

        expect(container.innerHTML).toBe('<b>Budapest</b> City');
    });

    it('should highlight filter with <b> tag when filter is substring of name despite the case and gaps', () => {
        mockProps.filterValue = '  budapest  ';

        const { container } = render(<HighlightedText {...mockProps} />);

        expect(container.innerHTML).toBe('<b>Budapest</b> City');
    });

    it('should highlight only first filter value entry', () => {
        mockProps.text = 'Budapest Budapest';

        const { container } = render(<HighlightedText {...mockProps} />);

        expect(container.innerHTML).toBe('<b>Budapest</b> Budapest');
    });

    it('should highlight each word from filterValue', () => {
        mockProps.text = 'Budapest City Hotel';
        mockProps.filterValue = 'Hotel Budapest';

        const { container } = render(<HighlightedText {...mockProps} />);

        expect(container.innerHTML).toBe('<b>Budapest</b> City <b>Hotel</b> ');
    });
});

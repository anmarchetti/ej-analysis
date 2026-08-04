import * as React from 'react';
import { render, screen } from '@testing-library/react';

import AnimatedCounter from './AnimatedCounter';

const mockNumberColumnComponent = jest.fn();

jest.mock('./NumberColumn', () => ({
    __esModule: true,
    default: props => {
        mockNumberColumnComponent(props);

        return <div data-tid='number-column' />;
    },
}));

const props = {
    fontSize: '10px',
    lineHeight: '20px',
    value: 11,
};

describe('<AnimatedCounter />', () => {
    it('should be rendered', () => {
        render(<AnimatedCounter {...props} />);

        expect(mockNumberColumnComponent).toHaveBeenCalledWith({
            digit: 1,
        });

        expect(screen.getAllByTestId('number-column')).toHaveLength(2);
    });

    it('should be rendered with default props', () => {
        render(<AnimatedCounter />);

        expect(mockNumberColumnComponent).toHaveBeenCalledWith({
            digit: 0,
        });

        expect(screen.getAllByTestId('number-column')).toHaveLength(1);
    });
});

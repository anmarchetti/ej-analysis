import React from 'react';
import { render } from '@testing-library/react';

import * as utils from 'frontend/utils/componentStylesCustomisation.utils';

import LineSeparator from './LineSeparator';

const createProps = () => ({
    props: { PaddingSize: '48px' },
});

let mockProps;

describe('<LineSeparator />', () => {
    beforeEach(() => {
        mockProps = createProps();
        jest.spyOn(utils, 'getPaddingSizeClassName').mockReturnValue('test' as any);
    });

    it('should render LineSeparator', () => {
        const { getByTestId } = render(<LineSeparator {...mockProps} />);

        expect(getByTestId('line-separator')).toBeInTheDocument();
    });

    it('should render container with className from getPaddingSizeClassName', () => {
        const { container } = render(<LineSeparator {...mockProps} />);

        expect(container.getElementsByClassName('test').length).toBe(1);
    });
});

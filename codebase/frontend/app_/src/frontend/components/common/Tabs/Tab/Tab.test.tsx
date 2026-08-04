import React from 'react';
import { render } from '@testing-library/react';

import Tab from './Tab';

const createDefaultProps = () => ({
    children: <div>Child</div>,
    isActive: true,
});

let mockProps: any = createDefaultProps();

describe('<Tab />', () => {
    beforeEach(() => {
        mockProps = createDefaultProps();
    });

    it('should render props', () => {
        const view = render(<Tab {...mockProps} />);

        expect(view.getByText('Child')).toBeInTheDocument();
    });
});

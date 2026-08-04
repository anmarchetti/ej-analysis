import React from 'react';
import { render } from '@testing-library/react';

import Tabs from './Tabs';

const createDefaultProps = () => ({
    tabs: [
        {
            title: 'title1',
            key: 'key 1',
            content: <div>content 1</div>,
        },
        {
            title: 'title2',
            key: 'key 2',
            content: <div>content 2</div>,
        },
    ],
    dataId: 'dataId',
    showArrow: false,
    onChange: jest.fn(),
});

let mockProps: any = createDefaultProps();

describe('<Tabs />', () => {
    beforeEach(() => {
        mockProps = createDefaultProps();
    });

    it('should render props', () => {
        const view = render(<Tabs {...mockProps} />);

        expect(view.getByText('title1')).toBeInTheDocument();
        expect(view.getByText('title2')).toBeInTheDocument();
        expect(view.getByText('content 1')).toBeInTheDocument();
        expect(view.getByText('content 2')).toBeInTheDocument();
    });

    it('should not render arrow', () => {
        const { queryByTestId } = render(<Tabs {...mockProps} />);

        expect(queryByTestId('tab-arrow')).not.toBeInTheDocument();
    });
});

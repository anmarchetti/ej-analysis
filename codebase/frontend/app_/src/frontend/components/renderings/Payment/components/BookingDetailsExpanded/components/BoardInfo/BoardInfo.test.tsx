import * as React from 'react';
import { render, screen } from '@testing-library/react';

import BoardInfo, { IBoardInfoProps } from './BoardInfo';

const createProps = (): IBoardInfoProps => ({
    board: {
        code: 'code',
        title: 'title',
        content: 'content',
        description: 'description',
        iconUrl: 'iconUrl',
    },
});

let mockProps = createProps();

jest.mock('frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon', () => ({
    __esModule: true,
    default: () => <div data-tid='board-image'>Board Image</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<BoardInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render default when everything is passed', () => {
        render(<BoardInfo {...mockProps} />);

        expect(screen.queryByTestId('board-container')).toBeInTheDocument();
        expect(screen.getByTestId('board-image')).toHaveTextContent('Board Image');
        expect(screen.getByTestId('board-title')).toHaveTextContent('title');
        expect(screen.getByTestId('board-description')).toHaveTextContent('content');
    });

    it('should NOT render when board is null', () => {
        mockProps.board = null;
        const { container } = render(<BoardInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});

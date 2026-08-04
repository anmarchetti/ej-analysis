import { render, screen } from '@testing-library/react';

import { mockBoardType } from 'frontend/__mocks__';

import BoardDetails from './BoardDetails';

const createMockProps = () => ({
    boardType: mockBoardType,
});

let mockProps;

const mockBoardTypeIconProps = jest.fn();
jest.mock('frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon', () => ({
    __esModule: true,
    default: props => {
        mockBoardTypeIconProps(props);

        return <div data-tid='board-type-icon' />;
    },
}));

describe('<BoardDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render BoardDetails component', () => {
        render(<BoardDetails {...mockProps} />);

        expect(screen.getByTestId('board-details')).toBeInTheDocument();
        expect(screen.getByTestId('board-type-icon')).toBeInTheDocument();
        expect(screen.getByText('Half Board')).toBeInTheDocument();
    });

    it('should render dataTid if provided', () => {
        mockProps.dataTid = 'test-id';
        render(<BoardDetails {...mockProps} />);

        expect(screen.getByTestId('test-id')).toBeInTheDocument();
        expect(screen.getByTestId('test-id-title')).toBeInTheDocument();
    });

    it('should render className if provided', () => {
        mockProps.className = 'test-class';
        render(<BoardDetails {...mockProps} />);

        expect(screen.getByTestId('board-details')).toHaveClass('test-class');
    });
});

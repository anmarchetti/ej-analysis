import React from 'react';
import { render, screen } from '@testing-library/react';

import { IShowMoreButtonProps, ShowMoreButton } from './ShowMoreButton';

const createProps = (): IShowMoreButtonProps => ({
    title: 'title',
    onClick: jest.fn(),
    isChevronUp: false,
    dataTid: 'show-more-button',
    className: 'className',
});

let mockProps;

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return <div data-tid={props.dataTid}>{props.children}</div>;
    },
}));

const mockChevron = jest.fn();
jest.mock('frontend/components/icons-new/ChevronDown', () => ({
    __esModule: true,
    default: props => {
        mockChevron(props);

        return <div data-tid='chevron-down' />;
    },
}));

describe('<ShowMoreButton />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<ShowMoreButton {...mockProps} />);

        expect(screen.queryByTestId(mockProps.dataTid)).toHaveTextContent(mockProps.title);
        expect(mockButton).toHaveBeenCalledWith(
            expect.objectContaining({
                className: mockProps.className,
                onClick: mockProps.onClick,
                isText: true,
                id: mockProps.id,
                dataTid: mockProps.dataTid,
            }),
        );

        expect(screen.queryByTestId('chevron-down')).toBeInTheDocument();
        expect(mockChevron).toHaveBeenCalledWith({ className: '' });
    });

    it('should render with isChevronUp props', () => {
        mockProps.isChevronUp = true;

        render(<ShowMoreButton {...mockProps} />);

        expect(screen.queryByTestId('chevron-down')).toBeInTheDocument();
        expect(mockChevron).toHaveBeenCalledWith({ className: 'icon--reflect-y' });
    });
});

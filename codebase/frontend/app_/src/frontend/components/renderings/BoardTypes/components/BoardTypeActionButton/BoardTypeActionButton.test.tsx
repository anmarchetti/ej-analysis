import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { BoardTypeActionButtonType } from 'models/enum/BoardTypeActionButtonType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BoardTypeActionButton, { IBoardTypeActionButtonProps } from './BoardTypeActionButton';

expect.extend(toHaveNoViolations);

const mockedTextContent = 'ChangeButton';

const mockBlockSelectedProps = jest.fn();
jest.mock('frontend/components/common/BlockSelected', () => ({
    __esModule: true,
    default: props => {
        mockBlockSelectedProps(props);

        return <div data-tid='block-selected' />;
    },
}));

const createProps: () => IBoardTypeActionButtonProps = () => ({
    buttonType: BoardTypeActionButtonType.Selected,
    children: <div>{mockedTextContent}</div>,
    onClick: jest.fn(),
});

let mockProps;

describe('BoardTypeActionButton', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<BoardTypeActionButton {...mockProps} />);

        expect(screen.getByTestId('block-selected')).toBeInTheDocument();
        expect(mockBlockSelectedProps).toHaveBeenCalledWith({
            className: 'boardSelected',
            dataTid: 'selected-board-type',
            siteCoreKey: SitecoreDictionary.BoardTypesButtonsSelected,
        });
    });

    it('should render "Price" button when buttonType is Price', () => {
        mockProps.buttonType = BoardTypeActionButtonType.Price;
        mockProps.children = <span>+£74pp</span>;

        render(<BoardTypeActionButton {...mockProps} />);

        const button = screen.getByTestId('board-type-action-button-price');

        expect(button).toHaveTextContent('+£74pp');
        expect(button).toHaveClass('actionButton');
        expect(button).toHaveClass('btn--full-width');
    });

    it('should skip render when buttonType is unknown', () => {
        mockProps.buttonType = 'unknown' as BoardTypeActionButtonType;
        const { container } = render(<BoardTypeActionButton {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should skip render when buttonType is Included', () => {
        mockProps.buttonType = BoardTypeActionButtonType.Included;
        const { container } = render(<BoardTypeActionButton {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call onClick function on "Price" button click', () => {
        mockProps.buttonType = BoardTypeActionButtonType.Price;

        render(<BoardTypeActionButton {...mockProps} />);
        const button = screen.getByRole('button');

        fireEvent.click(button);

        expect(mockProps.onClick).toBeCalled();
    });

    it('should render "PricePB" button when buttonType is PricePB', () => {
        mockProps.buttonType = BoardTypeActionButtonType.PricePB;
        mockProps.children = <span>+£74pp</span>;

        render(<BoardTypeActionButton {...mockProps} />);

        const button = screen.getByTestId('select-board-button');

        expect(button).toHaveTextContent('+£74pp');
        expect(button).toHaveClass('actionButtonPB');
        expect(button).toHaveClass('btn--medium');
    });

    it('should call onClick function on "PricePB" button click', () => {
        mockProps.buttonType = BoardTypeActionButtonType.PricePB;

        render(<BoardTypeActionButton {...mockProps} />);
        const button = screen.getByRole('button');

        fireEvent.click(button);

        expect(mockProps.onClick).toBeCalled();
    });

    it('should pass rest props to button', () => {
        mockProps.buttonType = BoardTypeActionButtonType.Price;
        (mockProps as any).tabIndex = -1;

        render(<BoardTypeActionButton {...mockProps} />);
        const button = screen.getByTestId('board-type-action-button-price');

        expect(button).toHaveAttribute('tabIndex', '-1');
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BoardTypeActionButton {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});

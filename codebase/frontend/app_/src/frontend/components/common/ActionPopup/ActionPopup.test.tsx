import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ActionPopup, { IActionPopupProps } from './ActionPopup';

const createProps = (): IActionPopupProps => ({
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    continueLabel: 'Continue',
    cancelLabel: 'Cancel',
    onContinue: jest.fn(),
    onCancel: jest.fn(),
});

let mockProps: IActionPopupProps;

const mockPopup = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopup(props);

        return <div data-tid='popup'>{props.children}</div>;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return (
            <div data-tid={props.dataId} className={props.className}>
                {props.field?.value}
            </div>
        );
    },
}));

describe('ActionPopup', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render ActionPopup', () => {
        render(<ActionPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopup).toBeCalledWith(
            expect.objectContaining({
                containerClass: 'cancelPopupContainer',
                dialogClass: 'popupDialog',
                bodyClass: 'popupBody',
                isInnerPopup: undefined,
                onClose: undefined,
            }),
        );

        expect(screen.getByTestId('action-popup-title')).toHaveClass('title');
        expect(screen.getByTestId('action-popup-description')).toHaveClass('content');
        expect(screen.getByTestId('action-popup-continue')).toHaveClass('continueBtn');
        expect(screen.getByTestId('action-popup-cancel')).toHaveClass('cancelBtn');

        expect(screen.getByTestId('action-popup-title')).toHaveTextContent('Test Title');
        expect(screen.getByTestId('action-popup-description')).toHaveTextContent('Test Subtitle');
        expect(screen.getByTestId('action-popup-continue')).toHaveTextContent('Continue');
        expect(screen.getByTestId('action-popup-cancel')).toHaveTextContent('Cancel');

        expect(mockRichTextWithLinks).toHaveBeenCalledWith(
            expect.objectContaining({
                field: { value: 'Test Subtitle' },
                tag: 'p',
                className: 'content',
                dataId: 'action-popup-description',
            }),
        );
    });

    describe('onContinue', () => {
        it('should call onContinue callback when continue button is clicked', async () => {
            render(<ActionPopup {...mockProps} />);

            const btn = screen.getByTestId('action-popup-continue');

            await userEvent.click(btn);

            expect(mockProps.onContinue).toBeCalled();
        });
    });

    describe('onCancel', () => {
        it('should call onCancel callback when cancel button is clicked', async () => {
            render(<ActionPopup {...mockProps} />);

            const btn = screen.getByTestId('action-popup-cancel');

            await userEvent.click(btn);

            expect(mockProps.onCancel).toBeCalled();
        });
    });

    describe('onClose', () => {
        it('should pass onClose prop to Popup when provided', () => {
            const mockOnClose = jest.fn();

            render(<ActionPopup {...mockProps} onClose={mockOnClose} />);

            expect(mockPopup).toHaveBeenCalledWith(
                expect.objectContaining({
                    onClose: mockOnClose,
                }),
            );
        });

        it('should pass undefined when onClose is not provided', () => {
            render(<ActionPopup {...mockProps} />);

            expect(mockPopup).toHaveBeenCalledWith(
                expect.objectContaining({
                    onClose: undefined,
                }),
            );
        });
    });
});

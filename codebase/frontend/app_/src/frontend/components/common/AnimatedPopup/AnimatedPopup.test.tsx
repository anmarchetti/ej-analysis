import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AnimatedPopup, { IAnimatedPopupProps } from './AnimatedPopup';

jest.mock('frontend/components/icons-new/Bell.tsx', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-bell' />,
}));

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup/PopupNew', () => ({
    __esModule: true,
    default: ({ children, footerContent, onClose, ...props }) => {
        mockPopupComponent(props);

        return (
            <button data-tid='popup' onClick={onClose} onKeyDown={jest.fn()}>
                {footerContent}
                {children}
            </button>
        );
    },
}));

const createProps = (): IAnimatedPopupProps => ({
    content: <div data-tid='content' />,
    firstButton: {
        content: 'button 1',
        dataTid: 'button-1',
        onClick: jest.fn(),
        className: 'test-class-1',
    },
    secondButton: {
        content: 'button 2',
        dataTid: 'button-2',
        onClick: jest.fn(),
        className: 'test-class-2',
    },
    showCloseButton: false,
    isShown: true,
    containerClass: 'container-class',
    onClose: jest.fn(),
});

let mockProps;
const user = userEvent.setup({ delay: 0 });

describe('<AnimatedPopup />', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockProps = createProps();
    });

    it('should NOT render when isShown is false', () => {
        mockProps.isShown = false;

        const { container } = render(<AnimatedPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render elements correctly', () => {
        render(<AnimatedPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(screen.getByTestId('button-1')).toHaveTextContent('button 1');
        expect(screen.getByTestId('button-2')).toHaveTextContent('button 2');
        expect(mockPopupComponent).toHaveBeenCalledWith({
            containerClass: 'container container-class',
            dialogClass: 'content',
            showCloseButton: false,
        });
    });

    it('should NOT render 2nd button when only 1st button is provided', () => {
        mockProps.secondButton = undefined;

        render(<AnimatedPopup {...mockProps} />);

        expect(screen.queryByTestId('button-2')).not.toBeInTheDocument();
    });

    it('should call onClick functions on button clicks', async () => {
        render(<AnimatedPopup {...mockProps} />);

        user.click(screen.getByTestId('button-1'));

        await waitFor(() => {
            expect(mockProps.firstButton.onClick).toHaveBeenCalled();
        });

        user.click(screen.getByTestId('button-2'));

        await waitFor(() => {
            expect(mockProps.secondButton.onClick).toHaveBeenCalled();
        });
    });

    it('should call onClose on close click', async () => {
        render(<AnimatedPopup {...mockProps} />);

        user.click(screen.getByTestId('popup'));

        await waitFor(() => {
            expect(mockProps.onClose).toHaveBeenCalled();
        });
    });
});

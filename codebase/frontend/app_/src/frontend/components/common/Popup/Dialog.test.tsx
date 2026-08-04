import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Dialog, { IDialogProps } from './Dialog';

jest.mock('./PopupCloseButton', () => ({
    __esModule: true,
    default: ({ onClose }) => <div data-tid='popup-close-button' onClick={onClose} />,
}));

describe('<Dialog />', () => {
    const resetMocks = (): IDialogProps => ({});
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render component', () => {
        render(<Dialog {...mocks} />);

        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('should render PopupCloseButton if showCloseButton is true', () => {
        mocks.showCloseButton = true;
        render(<Dialog {...mocks} />);

        expect(screen.getByTestId('popup-close-button')).toBeInTheDocument();
    });

    it('should not render PopupCloseButton if showCloseButton is false', () => {
        mocks.showCloseButton = false;
        render(<Dialog {...mocks} />);

        expect(screen.queryByTestId('popup-close-button')).not.toBeInTheDocument();
    });

    it('should call onClose', async () => {
        mocks.showCloseButton = true;
        mocks.onClose = jest.fn();
        render(<Dialog {...mocks} />);

        await userEvent.click(screen.getByTestId('popup-close-button'));

        waitFor(() => expect(mocks.onClose).toHaveBeenCalled());
    });

    it('should render title if provided', () => {
        mocks.title = 'title';
        render(<Dialog {...mocks} />);

        expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should not render title if not provided', () => {
        mocks.title = undefined;
        render(<Dialog {...mocks} />);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('Should render tabs', () => {
        const { container } = render(<Dialog tabs={<div>tabs</div>} />);

        expect(container.querySelector('.popup__tabs')).toHaveTextContent('tabs');
    });

    it('should apply a custom wrapper to the dialog content when provided', () => {
        const customWrapper = (children: React.ReactNode) => <div data-tid='custom-wrapper'>{children}</div>;

        const childText = 'Dialog child content';

        render(
            <Dialog wrapper={customWrapper}>
                <p>{childText}</p>
            </Dialog>,
        );

        const wrapperElement = screen.getByTestId('custom-wrapper');
        expect(wrapperElement).toBeInTheDocument();

        const contentElement = screen.getByTestId('dialog-content');
        expect(wrapperElement).toContainElement(contentElement);

        expect(screen.getByText(childText)).toBeInTheDocument();
    });
});

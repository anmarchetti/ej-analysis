import * as utils from 'react-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { lockBodyScroll, unLockBodyScroll } from 'frontend/utils/ui.utils';

import { IPopupProps, Popup } from './Popup';

jest.mock('frontend/utils/ui.utils');
jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: () => ({
        getPhrase: jest.fn(p => p),
    }),
}));

const mockDialogComponent = jest.fn();
jest.mock('./Dialog', () => ({
    __esModule: true,
    default: props => {
        mockDialogComponent(props);

        return <div data-tid='dialog' />;
    },
}));

jest.mock('frontend/components/common/Popup/PopupCloseButton', () => ({
    __esModule: true,
    default: () => <div data-tid='popup-close-button' />,
}));

const resetMocks = (): IPopupProps => ({
    bodyClass: 'bodyClass',
    contentClass: 'contentClass',
    contentStyle: {},
    dialogClass: 'dialogClass',
    footerContent: <div data-tid='footer-content' />,
    isFooterButtonsOnLeft: true,
    onClose: jest.fn(),
    showCloseButton: true,
    tabs: <div data-tid='tabs' />,
    title: 'title',
});

let mocks;

describe('<Popup />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render empty popup with overlay', () => {
        render(<Popup />);

        expect(screen.getByTestId('popup-overlay')).toBeInTheDocument();
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should call onClose on overlay click', async () => {
        render(<Popup {...mocks} />);

        await userEvent.click(screen.getByTestId('popup-overlay'));
        expect(mocks.onClose).toHaveBeenCalled();
    });

    it('should NOT call onClose on overlay click when disableOutsideClick is true', async () => {
        mocks.disableOutsideClick = true;
        render(<Popup {...mocks} />);

        await userEvent.click(screen.getByTestId('popup-overlay'));
        expect(mocks.onClose).not.toHaveBeenCalled();
    });

    it('should call onClose on escape click with "Escape" keyboard key', async () => {
        render(<Popup {...mocks} />);

        await userEvent.keyboard('{Escape}');
        expect(mocks.onClose).toHaveBeenCalled();
    });

    it('should call onClose on escape click with "Esc" keyboard key', async () => {
        render(<Popup {...mocks} />);

        await userEvent.keyboard('{Esc}');
        expect(mocks.onClose).toHaveBeenCalled();
    });

    it('should NOT call onClose on enter key', async () => {
        render(<Popup {...mocks} />);

        await userEvent.keyboard('{Enter}');
        expect(mocks.onClose).not.toHaveBeenCalled();
    });

    it('should render dialog inside modal-portal-root when withPortal is true', () => {
        const portalRoot = document.createElement('div');
        portalRoot.id = 'modal-portal-root';
        document.body.appendChild(portalRoot);
        jest.spyOn(utils, 'createPortal');
        mocks.withPortal = true;

        render(<Popup {...mocks} />);

        const dialog = screen.getByRole('dialog');

        expect(document.getElementById('modal-portal-root')).toContainElement(dialog);
    });

    it('should render Dialog', () => {
        render(<Popup {...mocks} />);

        expect(mockDialogComponent).toHaveBeenCalledWith({
            bodyClass: 'bodyClass',
            children: undefined,
            contentClass: 'contentClass',
            dialogClass: 'dialogClass',
            footerContent: <div data-tid='footer-content' />,
            isFooterButtonsOnLeft: true,
            onClose: expect.any(Function),
            popupRef: undefined,
            showCloseButton: true,
            dataTid: 'popup-dialog-7-dialog',
            tabs: <div data-tid='tabs' />,
            title: 'title',
            contentStyle: mocks.contentStyle,
        });
    });

    it('should render PopupCloseButton when isCloseButtonOutside', () => {
        mocks.isCloseButtonOutside = true;
        render(<Popup {...mocks} />);

        expect(screen.getByTestId('popup-close-button')).toBeInTheDocument();
    });

    describe('Lock body scroll', () => {
        it('Should lock/unlock body scroll on mount/unmount', () => {
            const { unmount } = render(<Popup />);
            expect(lockBodyScroll).toHaveBeenCalled();

            unmount();
            expect(unLockBodyScroll).toHaveBeenCalled();
        });

        it('Should NOT lock/unlock body scroll if isInnerPopup', () => {
            const { unmount } = render(<Popup isInnerPopup />);
            expect(lockBodyScroll).not.toHaveBeenCalled();

            unmount();
            expect(unLockBodyScroll).not.toHaveBeenCalled();
        });

        it('Should NOT lock/unlock body scroll if isToastPopup', () => {
            const { unmount } = render(<Popup isToastPopup />);
            expect(lockBodyScroll).not.toHaveBeenCalled();

            unmount();
            expect(unLockBodyScroll).not.toHaveBeenCalled();
        });
    });

    describe('Popup classes', () => {
        it('Should render custom class', () => {
            const { container } = render(<Popup containerClass={'containerClass'} />);
            expect(container.firstChild).toHaveClass('containerClass');
        });

        it('Should render popup--small class', () => {
            const { container } = render(<Popup isSmall />);
            expect(container.firstChild).toHaveClass('popup--small');
        });

        it('Should render class when content is centered', () => {
            const { container } = render(<Popup isContentCentered />);
            expect(container.firstChild).toHaveClass('popup--text-center');
        });

        it('Should render on center', () => {
            const { container } = render(<Popup isCentered />);
            expect(container.firstChild).toHaveClass('popup--centered');
        });

        it('should not have centered class when isCentered false', () => {
            const { container } = render(<Popup isCentered={false} />);
            expect(container.firstChild).not.toHaveClass('popup--centered');
        });

        it('Should render full width', () => {
            const { container } = render(<Popup isFullWidth />);
            expect(container.firstChild).toHaveClass('popup--full-width');
        });

        it('Should render tabs', () => {
            const { container } = render(<Popup tabs={<div>tabs</div>} />);

            expect(container.firstChild).toHaveClass('popup--with-tabs');
        });

        it('Should render overlay class', () => {
            const { container } = render(<Popup overlayClass='overlayClass' />);

            expect(container.querySelector('.overlayClass')).toBeInTheDocument();
        });

        it('Should remove default class', () => {
            const { container } = render(<Popup removeDefaultClasses />);
            expect(container.firstChild).not.toHaveClass('popup');
        });
    });
});

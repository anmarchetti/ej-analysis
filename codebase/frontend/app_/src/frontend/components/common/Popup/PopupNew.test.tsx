import React from 'react';
import { render, screen } from '@testing-library/react';

import * as idUtils from 'frontend/hooks/useUniqueId';
import * as uiUtils from 'frontend/utils/ui.utils';

import PopupNew, { IPopupNewProps } from './PopupNew';

const mockFocusTrapComponent = jest.fn();
jest.mock('focus-trap-react', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockFocusTrapComponent(props);

        return (
            <div data-tid='focus-trap' onClick={props.onClick}>
                {children}
            </div>
        );
    },
}));

const mockDialog = jest.fn();
jest.mock('./Dialog', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDialog(props);

        return <div data-tid='dialog'>{children}</div>;
    },
}));

const createProps = (): IPopupNewProps => ({
    children: () => <div data-tid='popup-content'>popup</div>,
    onClose: jest.fn(),
    fullWidth: true,
    id: 'popup-id',
    containerClass: 'container-class',
    dialogClass: 'dialog-class',
    showCloseButton: true,
});

let props;

const modalPortal = document.createElement('div');
modalPortal.setAttribute('id', 'modal-portal-root');

document.body.appendChild(modalPortal);

const root = document.createElement('div');
root.setAttribute('id', '__next');

document.body.appendChild(root);

describe('<PopupNew />', () => {
    beforeEach(() => {
        props = createProps();
        jest.spyOn(idUtils, 'default').mockReturnValue('unique-id-test');
    });

    it('should be rendered when children is function', () => {
        const lockBodyScroll = jest.spyOn(uiUtils, 'lockBodyScroll');
        const unLockBodyScroll = jest.spyOn(uiUtils, 'unLockBodyScroll');

        const { unmount } = render(<PopupNew {...props} />);

        expect(lockBodyScroll).toHaveBeenCalled();
        expect(mockFocusTrapComponent).toHaveBeenCalledWith({
            active: true,
            focusTrapOptions: {
                clickOutsideDeactivates: true,
                escapeDeactivates: true,
                fallbackFocus: '#popup-id',
                initialFocus: '#popup-id',
                onDeactivate: props.onClose,
                returnFocusOnDeactivate: false,
            },
        });
        expect(screen.getByTestId('focus-trap')).toBeInTheDocument();
        expect(screen.getByTestId(props.id)).toBeInTheDocument();
        expect(screen.getByTestId('popup-content')).toBeInTheDocument();
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();

        unmount();

        expect(unLockBodyScroll).toHaveBeenCalled();
    });

    it('should render disabled focus trap when disableFocusTrap is true', () => {
        props.disableFocusTrap = true;

        render(<PopupNew {...props} />);

        expect(mockFocusTrapComponent).toHaveBeenCalledWith({
            active: false,
            focusTrapOptions: {
                clickOutsideDeactivates: false,
                escapeDeactivates: true,
                fallbackFocus: '#popup-id',
                initialFocus: '#popup-id',
                onDeactivate: props.onClose,
                returnFocusOnDeactivate: false,
            },
        });
    });

    it('should render dialog when children are NOT function', () => {
        props.children = <div data-tid='test-children' />;

        render(<PopupNew {...props} />);

        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('test-children')).toBeInTheDocument();
        expect(mockDialog).toHaveBeenCalledWith({
            dataTid: 'popup-id-dialog',
            dialogClass: 'dialog-class',
            footerContent: undefined,
            onClose: expect.any(Function),
            showCloseButton: true,
        });
    });

    it('should use uniqueId when id is NOT provided', () => {
        props.id = undefined;

        render(<PopupNew {...props} />);

        expect(screen.getByTestId('unique-id-test')).toBeInTheDocument();
    });
});

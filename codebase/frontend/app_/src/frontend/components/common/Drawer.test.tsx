import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import classNames from 'classnames';

import { lockBodyScroll, unLockBodyScroll } from 'frontend/utils/ui.utils';

import { Drawer } from './Drawer';

jest.mock('frontend/utils/ui.utils');
const scrollTo = jest.fn();
Object.defineProperty(global, 'scrollTo', { value: scrollTo });

const mockFocusTrap = jest.fn();
jest.mock('focus-trap-react', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockFocusTrap(props);

        return <div data-tid='focus-trap'>{children}</div>;
    },
}));

jest.mock('classnames', () => jest.fn());
const mockedClassNames = classNames as jest.MockedFn<typeof classNames>;

describe('<Drawer />', () => {
    const resetMocks = () => ({
        containerRef: undefined,
        open: false,
        setIsBodyScrollLocked: jest.fn(),
        isBodyScrollLocked: false,
        isInDrawer: false,
        isGreyBackground: false,
        dataTid: 'data-tid-selector',
        getPhrase: jest.fn(),
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Drawer should render', () => {
        it('Should standard', () => {
            render(<Drawer {...mocks} />);

            const drawer = screen.getByRole('dialog');

            expect(mockedClassNames).toBeCalledWith(undefined, 'drawer', false, false);
            expect(screen.getByTestId(mocks.dataTid)).toBeInTheDocument();
            expect(drawer.getAttribute('data-drawer-status')).toBe('close');
            expect(screen.queryByTestId('focus-trap')).not.toBeInTheDocument();
        });

        it('should render focus trap when isFocusTrap is true', () => {
            mocks.isFocusTrap = true;

            render(<Drawer {...mocks} />);

            expect(screen.getByTestId('focus-trap')).toBeInTheDocument();
            expect(mockFocusTrap).toHaveBeenCalledWith({
                active: false,
                focusTrapOptions: {
                    clickOutsideDeactivates: true,
                    returnFocusOnDeactivate: false,
                },
            });
        });

        it('Should render with open className', () => {
            mocks.open = true;
            render(<Drawer {...mocks} />);

            const drawer = screen.getByRole('dialog');

            expect(mockedClassNames).toBeCalledWith(undefined, 'drawer', 'drawer--open', false);
            expect(drawer.getAttribute('data-drawer-status')).toBe('open');
        });

        it('Should render with drawer grey className', () => {
            mocks.isGreyBackground = true;
            render(<Drawer {...mocks} />);
            expect(mockedClassNames).toBeCalledWith(undefined, 'drawer', false, 'drawer--grey');
        });
    });

    describe('Drawer expect function', () => {
        it('Should expect componentWillUnmount', () => {
            const { unmount } = render(<Drawer {...mocks} />);

            const componentWillUnmount = jest.spyOn(Drawer.prototype, 'componentWillUnmount');
            unmount();
            expect(componentWillUnmount).toHaveBeenCalled();
        });

        it('Should expect componentDidUpdate', () => {
            const prevProps = {
                containerRef: undefined,
                open: false,
                setIsBodyScrollLocked: jest.fn(),
                isBodyScrollLocked: false,
                getPhrase: jest.fn(),
            };
            const newProps = {
                containerRef: undefined,
                open: true,
                setIsBodyScrollLocked: jest.fn(),
                isBodyScrollLocked: false,
                getPhrase: jest.fn(),
            };

            const { rerender } = render(<Drawer {...prevProps} />);

            const componentDidUpdate = jest.spyOn(Drawer.prototype, 'componentDidUpdate');
            rerender(<Drawer {...newProps} />);

            expect(componentDidUpdate).toBeCalled();

            rerender(<Drawer {...prevProps} />);

            expect(componentDidUpdate).toBeCalled();
        });
    });

    describe('Lock body scroll', () => {
        it('Should lock/unlock body scroll on mount/unmount', async () => {
            mocks.open = true;
            mocks.isBodyScrollLocked = false;
            render(<Drawer {...mocks} />);
            await waitFor(() => {
                expect(lockBodyScroll).toBeCalled();
            });

            mocks.isBodyScrollLocked = true;
            const { unmount } = render(<Drawer {...mocks} />);
            unmount();
            expect(unLockBodyScroll).toBeCalled();
        });
    });
});

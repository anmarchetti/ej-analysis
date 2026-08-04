import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import MobileContent from './MobileContent';
import * as utils from './MobileContent.utils';

import styles from './MobileContent.module.scss';

const mockAnimatedWrapper = jest.fn();
jest.mock('frontend/components/common/AnimatedWrapper/AnimatedWrapper', () => ({
    AnimatedWrapper: ({ children, ...props }) => {
        mockAnimatedWrapper(props);

        return <div>{children}</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mobileContentData = {
    onClose: jest.fn(),
    isMobile: true,
    content: {},
    overlay: {
        ref: {
            current: {} as HTMLDivElement,
        },
    },
    contentRef: {
        ref: {
            current: {} as HTMLDivElement,
        },
    } as any,
    isOverflow: false,
    getPhrase: jest.fn(p => p),
};

const useMobileContent = jest.spyOn(utils, 'default').mockReturnValue(mobileContentData);

const mockStores = createMockStores();
let mockProps;

describe('MobileContent', () => {
    beforeEach(() => {
        mockProps = {
            children: <div data-tid='children'>children</div>,
            getFloatingProps: jest.fn(),
            isAnimationLaunched: false,
            refs: {
                floating: React.createRef<HTMLDivElement>(),
                reference: React.createRef<HTMLDivElement>(),
            },
            setIsAnimationLaunched: jest.fn(),
            setOpen: jest.fn(),
            className: 'test-class',
        };
    });

    describe('Mobile', () => {
        it('should be rendered', async () => {
            mockProps.isMobileFullScreenFixed = true;

            const { container } = render(<MobileContent {...mockProps} />);

            const wrapper = screen.getByTestId('tooltip-mobile-wrapper');
            const overlay = screen.getByTestId('tooltip-mobile-overlay');
            const swipe = container.getElementsByClassName(styles.swipe)[0];
            const btn = screen.getByRole('button');

            expect(overlay).toHaveClass(mockProps.className);
            expect(wrapper).toBeInTheDocument();
            expect(wrapper).toHaveClass(styles.mobileWrapper, styles.fixedHeight);
            expect(swipe).toBeInTheDocument();
            expect(screen.getByTestId('children')).toBeInTheDocument();
            expect(btn).toBeInTheDocument();

            await userEvent.click(btn);

            expect(mobileContentData.onClose).toHaveBeenCalled();
        });

        it('should stop mousedown event propagation on overlay', () => {
            const onWrapperMouseDown = jest.fn();

            render(
                <div onMouseDown={onWrapperMouseDown}>
                    <MobileContent {...mockProps} />
                </div>,
            );

            fireEvent.mouseDown(screen.getByTestId('tooltip-mobile-overlay'));

            expect(onWrapperMouseDown).not.toHaveBeenCalled();
        });

        it('should render close button with outlined style by default', () => {
            render(<MobileContent {...mockProps} />);

            expect(screen.getByRole('button')).toHaveClass('btn--outlined');
            expect(screen.getByRole('button')).not.toHaveClass('primary');
        });

        it('should render close button with primary style when isPrimaryCloseButton is true', () => {
            render(<MobileContent {...{ ...mockProps, isPrimaryCloseButton: true }} />);

            expect(screen.getByRole('button')).toHaveClass('primary');
            expect(screen.getByRole('button')).not.toHaveClass('btn--outlined');
        });
    });

    describe('Tablet', () => {
        it('should be rendered', async () => {
            useMobileContent.mockReturnValue({ ...mobileContentData, isMobile: false });

            const { container } = render(<MobileContent {...mockProps} />);

            const wrapper = screen.getByTestId('tooltip-mobile-wrapper');
            const swipe = container.getElementsByClassName(styles.swipe)[0];
            const btn = screen.getByRole('button');

            expect(wrapper).toBeInTheDocument();
            expect(wrapper).toHaveClass(styles.tabletWrapper);
            expect(swipe).toBe(undefined);
            expect(screen.getByTestId('children')).toBeInTheDocument();
            expect(btn).toBeInTheDocument();

            await userEvent.click(btn);

            expect(mobileContentData.onClose).toHaveBeenCalled();
        });
    });
});

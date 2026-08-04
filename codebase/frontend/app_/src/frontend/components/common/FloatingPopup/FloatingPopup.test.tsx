import React, { PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import FloatingPopup, { IFloatingPopupProps } from './FloatingPopup';

expect.extend(toHaveNoViolations);

const createMockProps = (): PropsWithChildren<IFloatingPopupProps> => ({
    bodyClass: 'bodyClass',
    contentClass: 'contentClass',
    footerContent: <div data-tid='footer-content' />,
    children: <div />,
    hasFooterShadow: true,
    footerClass: 'footerClass',
    id: 'id',
    onClose: jest.fn(),
});

let props: PropsWithChildren<IFloatingPopupProps> = createMockProps();
let mockIsMobileViewport = false;

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockIsMobileViewport,
}));

const mockPopup = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopup(props);

        return <div data-tid={props.id} />;
    },
}));

describe('FloatingPopup', () => {
    beforeEach(() => {
        props = createMockProps();
        mockIsMobileViewport = false;
    });

    it('calls Popup with correct props', () => {
        render(<FloatingPopup {...props} />);

        expect(mockPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                onClose: props.onClose,
                contentClass: 'content contentClass',
                contentStyle: { transform: 'translateY(0px)' },
                overlayClass: 'overlay',
                bodyClass: 'body bodyClass',
                footerClass: 'footer footerClass footerShadow',
                isCentered: true,
                id: props.id,
                footerContent: props.footerContent,
            }),
        );
    });

    it('uses default values if id and hasFooterShadow is not provided', () => {
        props.hasFooterShadow = undefined;
        props.id = undefined;
        render(<FloatingPopup {...props} />);

        expect(mockPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                onClose: props.onClose,
                contentClass: 'content contentClass',
                contentStyle: { transform: 'translateY(0px)' },
                overlayClass: 'overlay',
                bodyClass: 'body bodyClass',
                footerClass: 'footer footerClass',
                isCentered: true,
                id: 'floating-popup',
                footerContent: props.footerContent,
            }),
        );
    });

    it('calls Popup with swipeable content class when swipeable true', () => {
        props.swipeable = true;
        render(<FloatingPopup {...props} />);

        expect(mockPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                onClose: props.onClose,
                contentClass: 'content swipeable contentClass',
                contentStyle: { transform: 'translateY(0px)' },
                overlayClass: 'overlay',
                bodyClass: 'body bodyClass',
                footerClass: 'footer footerClass footerShadow',
                isCentered: true,
                id: props.id,
                footerContent: props.footerContent,
            }),
        );
    });

    it('calls Popup with isCentered false on mobile', () => {
        mockIsMobileViewport = true;
        render(<FloatingPopup {...props} />);

        expect(mockPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                isCentered: false,
            }),
        );
    });

    describe('Accessibility', () => {
        it('passes accessibility', async () => {
            const { container } = render(<FloatingPopup {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});

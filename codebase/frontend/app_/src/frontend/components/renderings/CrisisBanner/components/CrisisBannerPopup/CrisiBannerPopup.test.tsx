import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import CrisisBannerPopup, { ICrisisBannerPopupProps } from './CrisisBannerPopup';

expect.extend(toHaveNoViolations);

const mockPopupComponent = jest.fn();

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, footerContent, ...props }) => {
        mockPopupComponent(props);

        return (
            <div data-tid='popup'>
                {children}
                {footerContent}
            </div>
        );
    },
}));

const mockDrawerComponent = jest.fn();

jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDrawerComponent(props);

        return <div data-tid='drawer'>{children}</div>;
    },
}));

jest.mock('frontend/hooks/useMediaQuery');

const createProps = (): ICrisisBannerPopupProps => ({
    content: <div data-tid='content' />,
    ctaCloseButtonLabel: mockSitecoreField('buttonLabel'),
    ctaCloseButtonScreenReaderLabel: mockSitecoreField('readerLabel'),
    onClose: jest.fn(),
    open: true,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CrisisBannerPopup />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();

        jest.mocked(useMobileViewport).mockReturnValue(false);
    });

    it('should NOT render when open is false', () => {
        mockProps.open = false;
        const { container } = render(<CrisisBannerPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render Popup component when isMobile is false', () => {
        render(<CrisisBannerPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should render Drawer component when isMobile is true', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        render(<CrisisBannerPopup {...mockProps} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(mockDrawerComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                open: true,
                dataTid: 'crisis-banner-drawer',
            }),
        );
    });

    it('should call expected funcs when click on close button', async () => {
        render(<CrisisBannerPopup {...mockProps} />);

        await userEvent.click(screen.getByRole('button', { name: mockProps.ctaCloseButtonScreenReaderLabel.value }));

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call expected funcs when click on close button on mobile', async () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        render(<CrisisBannerPopup {...mockProps} />);

        await userEvent.click(screen.getByRole('button', { name: mockProps.ctaCloseButtonScreenReaderLabel.value }));

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<CrisisBannerPopup {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { IPricePromiseSuccessProps, PricePromiseSuccessMessage } from './PricePromiseSuccessMessage';

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockUseMobileViewport,
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopupProps(props);

        return <div data-tid='popup'>{props.children}</div>;
    },
}));

const mockDrawerComponent = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: props => {
        mockDrawerComponent(props);

        return <div data-tid='drawer'>{props.children}</div>;
    },
}));

const createProps = (): IPricePromiseSuccessProps => ({
    toggleSuccessMessage: jest.fn(),
    isSuccessMessageShown: true,
    SuccessMessagesRequestText: mockSitecoreField('RequestText'),
    SuccessMessagesRequestTitle: mockSitecoreField('RequestTitle'),
});

let mockStores = createMockStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PricePromiseSuccessMessage />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    describe('Desktop', () => {
        it('Should NOT render on desktop if the message is hidden', () => {
            mockProps.isSuccessMessageShown = false;
            const { container } = render(<PricePromiseSuccessMessage {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('Should render Popup on desktop if the message is shown', () => {
            render(<PricePromiseSuccessMessage {...mockProps} />);

            expect(screen.getByText(mockProps.SuccessMessagesRequestTitle.value)).toBeInTheDocument();
            expect(screen.getByText(mockProps.SuccessMessagesRequestText.value)).toBeInTheDocument();
            expect(screen.getByTestId('popup')).toBeInTheDocument();
            expect(mockPopupProps).toHaveBeenCalledWith({
                isContentCentered: true,
                containerClass: 'successDrawer',
                footerContent: expect.anything(),
                children: expect.anything(),
                contentClass: 'content',
                bodyClass: 'drawerBody',
                footerClass: 'footer',
            });
        });
    });

    describe('Mobile', () => {
        beforeEach(() => (mockUseMobileViewport = true));

        it('Should render Drawer on mobile ', () => {
            mockProps.isSuccessMessageShown = false;
            render(<PricePromiseSuccessMessage {...mockProps} />);

            expect(screen.getByText(mockProps.SuccessMessagesRequestTitle.value)).toBeInTheDocument();
            expect(screen.getByText(mockProps.SuccessMessagesRequestText.value)).toBeInTheDocument();
            expect(screen.getByTestId('drawer')).toBeInTheDocument();
            expect(mockDrawerComponent).toHaveBeenCalledWith({
                open: mockProps.isSuccessMessageShown,
                className: 'successDrawer',
                children: expect.anything(),
                contentClass: 'content',
                bodyClass: 'drawerBody',
                footerClass: 'footer',
                dataTid: 'success-drawer',
            });
        });

        it('Should call toggleSuccessMessage() on close', async () => {
            render(<PricePromiseSuccessMessage {...mockProps} />);

            await userEvent.click(screen.getByText('Globals.Buttons.Close'));

            expect(mockProps.toggleSuccessMessage).toHaveBeenCalledWith(false);
        });
    });
});

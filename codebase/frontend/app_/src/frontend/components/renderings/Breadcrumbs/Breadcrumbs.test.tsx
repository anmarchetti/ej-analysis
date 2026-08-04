import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BreadcrumbsPage from 'models/enum/BreadcrumbsPage';

import Breadcrumbs from './Breadcrumbs';
import useBreadcrumbs from './useBreadcrumbs';

jest.mock('./useBreadcrumbs');
jest.mock('./components/BreadItem', () => ({
    __esModule: true,
    default: ({ href, number, title, onClick }) => (
        <div className={title} onClick={onClick} data-testid='bread-item'>
            {title}
            <span className='number'>{number}</span>
            <a href={href} className='href'>
                {href}
            </a>
        </div>
    ),
}));

const mockUseBreadcrumbs = useBreadcrumbs as jest.MockedFunction<typeof useBreadcrumbs>;

describe('<Breadcrumbs />', () => {
    const mockChangeIsClickChangeButton = jest.fn();
    const mockHandleBreadcrumbClick = jest.fn();
    const mockHandlePopupClose = jest.fn();
    const mockHandlePopupContinue = jest.fn();

    const mockBreadItems = [
        { title: 'Holiday', key: BreadcrumbsPage.Holiday, href: '/holiday' },
        { title: 'Extras', key: BreadcrumbsPage.Extras, href: '/extras' },
        { title: 'Guests', key: BreadcrumbsPage.Guests, href: '/guests' },
        { title: 'Payment', key: BreadcrumbsPage.Payment, href: '/payment' },
    ];

    const createProps = (activePage?: BreadcrumbsPage) => ({
        params: { ActivePage: activePage },
        fields: undefined,
        rendering: {},
    });

    beforeEach(() => {
        mockUseBreadcrumbs.mockReturnValue({
            breadItems: mockBreadItems,
            activeItemIndex: 1,
            isExtrasPage: false,
            isFlightPlusHotelFunnel: false,
            changeIsClickChangeButton: mockChangeIsClickChangeButton,
            selectedBreadcrumb: null,
            handleBreadcrumbClick: mockHandleBreadcrumbClick,
            handlePopupClose: mockHandlePopupClose,
            handlePopupContinue: mockHandlePopupContinue,
        });
    });

    it('should call useBreadcrumbs with ActivePage param', () => {
        const props = createProps(BreadcrumbsPage.Extras);

        render(<Breadcrumbs {...props} />);

        expect(mockUseBreadcrumbs).toHaveBeenCalledWith(BreadcrumbsPage.Extras);
    });

    it('should call useBreadcrumbs with undefined when ActivePage is not provided', () => {
        const props = createProps(undefined);

        render(<Breadcrumbs {...props} />);

        expect(mockUseBreadcrumbs).toHaveBeenCalledWith(undefined);
    });

    it('should render breadcrumb items from hook', () => {
        const props = createProps(BreadcrumbsPage.Extras);

        render(<Breadcrumbs {...props} />);

        expect(screen.getByText('Holiday')).toBeInTheDocument();
        expect(screen.getByText('Extras')).toBeInTheDocument();
        expect(screen.getByText('Guests')).toBeInTheDocument();
        expect(screen.getByText('Payment')).toBeInTheDocument();
    });

    it('should pass correct props to BreadItem', () => {
        const props = createProps(BreadcrumbsPage.Extras);

        render(<Breadcrumbs {...props} />);

        const holidayItem = screen.getByText('Holiday');
        const extrasItem = screen.getByText('Extras');

        expect(holidayItem.querySelector('.number')?.textContent).toBe('1');
        expect(holidayItem.querySelector('.href')?.getAttribute('href')).toBe('/holiday');

        expect(extrasItem.querySelector('.number')?.textContent).toBe('2');
        expect(extrasItem.querySelector('.href')?.getAttribute('href')).toBe('/extras');
    });

    it('should apply isExtrasPage className when true', () => {
        mockUseBreadcrumbs.mockReturnValue({
            breadItems: mockBreadItems,
            activeItemIndex: 1,
            isExtrasPage: true,
            isFlightPlusHotelFunnel: false,
            changeIsClickChangeButton: mockChangeIsClickChangeButton,
            selectedBreadcrumb: null,
            handleBreadcrumbClick: jest.fn(),
            handlePopupClose: jest.fn(),
            handlePopupContinue: jest.fn(),
        });

        const props = createProps(BreadcrumbsPage.Extras);

        render(<Breadcrumbs {...props} />);

        const breadDiv = screen.getByTestId('bread-crumbs-wrapper');
        expect(breadDiv).toHaveClass('bread__extra-space');
    });

    it('should NOT apply isExtrasPage className when false', () => {
        mockUseBreadcrumbs.mockReturnValue({
            breadItems: mockBreadItems,
            activeItemIndex: 1,
            isExtrasPage: false,
            isFlightPlusHotelFunnel: false,
            changeIsClickChangeButton: mockChangeIsClickChangeButton,
            selectedBreadcrumb: null,
            handleBreadcrumbClick: jest.fn(),
            handlePopupClose: jest.fn(),
            handlePopupContinue: jest.fn(),
        });

        const props = createProps(BreadcrumbsPage.Extras);

        render(<Breadcrumbs {...props} />);

        const breadDiv = screen.getByTestId('bread-crumbs-wrapper');
        expect(breadDiv).not.toHaveClass('bread__extra-space');
    });

    it('should call changeIsClickChangeButton with false on item click', async () => {
        const props = createProps(BreadcrumbsPage.Extras);

        render(<Breadcrumbs {...props} />);

        const holidayItem = screen.getByText('Holiday');
        await userEvent.click(holidayItem);

        expect(mockChangeIsClickChangeButton).toHaveBeenCalledWith(false);
    });

    it('should render null when activeItemIndex is -1', () => {
        mockUseBreadcrumbs.mockReturnValue({
            breadItems: mockBreadItems,
            activeItemIndex: -1,
            isExtrasPage: false,
            isFlightPlusHotelFunnel: false,
            changeIsClickChangeButton: mockChangeIsClickChangeButton,
            selectedBreadcrumb: null,
            handleBreadcrumbClick: jest.fn(),
            handlePopupClose: jest.fn(),
            handlePopupContinue: jest.fn(),
        });

        const props = createProps(BreadcrumbsPage.Extras);

        const { container } = render(<Breadcrumbs {...props} />);

        expect(container.firstChild).toBeNull();
    });

    describe('Flight Plus Hotel Funnel classNames', () => {
        it('should apply fphWrapper and priority classes when isFlightPlusHotelFunnel is true', () => {
            mockUseBreadcrumbs.mockReturnValue({
                breadItems: mockBreadItems,
                activeItemIndex: 1,
                isExtrasPage: false,
                isFlightPlusHotelFunnel: true,
                changeIsClickChangeButton: mockChangeIsClickChangeButton,
                selectedBreadcrumb: null,
                handleBreadcrumbClick: jest.fn(),
                handlePopupClose: jest.fn(),
                handlePopupContinue: jest.fn(),
            });

            const props = createProps(BreadcrumbsPage.Extras);

            render(<Breadcrumbs {...props} />);

            const wrapper = screen.getByTestId('bread-crumbs-wrapper');
            expect(wrapper).toHaveClass('fphWrapper');
            expect(wrapper).toHaveClass('priority');
        });

        it('should NOT apply fphWrapper and priority classes when isFlightPlusHotelFunnel is false', () => {
            mockUseBreadcrumbs.mockReturnValue({
                breadItems: mockBreadItems,
                activeItemIndex: 1,
                isExtrasPage: false,
                isFlightPlusHotelFunnel: false,
                changeIsClickChangeButton: mockChangeIsClickChangeButton,
                selectedBreadcrumb: null,
                handleBreadcrumbClick: jest.fn(),
                handlePopupClose: jest.fn(),
                handlePopupContinue: jest.fn(),
            });

            const props = createProps(BreadcrumbsPage.Extras);

            render(<Breadcrumbs {...props} />);

            const wrapper = screen.getByTestId('bread-crumbs-wrapper');
            expect(wrapper).not.toHaveClass('fphWrapper');
            expect(wrapper).not.toHaveClass('priority');
        });

        it('should apply lastStep class when on last step in FPH funnel', () => {
            mockUseBreadcrumbs.mockReturnValue({
                breadItems: mockBreadItems,
                activeItemIndex: 3,
                isExtrasPage: false,
                isFlightPlusHotelFunnel: true,
                changeIsClickChangeButton: mockChangeIsClickChangeButton,
                selectedBreadcrumb: null,
                handleBreadcrumbClick: jest.fn(),
                handlePopupClose: jest.fn(),
                handlePopupContinue: jest.fn(),
            });

            const props = createProps(BreadcrumbsPage.Payment);

            render(<Breadcrumbs {...props} />);

            const wrapper = screen.getByTestId('bread-crumbs-wrapper');
            expect(wrapper).toHaveClass('lastStep');
        });

        it('should NOT apply lastStep class when NOT on last step in FPH funnel', () => {
            mockUseBreadcrumbs.mockReturnValue({
                breadItems: mockBreadItems,
                activeItemIndex: 1,
                isExtrasPage: false,
                isFlightPlusHotelFunnel: true,
                changeIsClickChangeButton: mockChangeIsClickChangeButton,
                selectedBreadcrumb: null,
                handleBreadcrumbClick: jest.fn(),
                handlePopupClose: jest.fn(),
                handlePopupContinue: jest.fn(),
            });

            const props = createProps(BreadcrumbsPage.Extras);

            render(<Breadcrumbs {...props} />);

            const wrapper = screen.getByTestId('bread-crumbs-wrapper');
            expect(wrapper).not.toHaveClass('lastStep');
        });

        it('should NOT apply lastStep class when on last step but NOT in FPH funnel', () => {
            mockUseBreadcrumbs.mockReturnValue({
                breadItems: mockBreadItems,
                activeItemIndex: 3,
                isExtrasPage: false,
                isFlightPlusHotelFunnel: false,
                changeIsClickChangeButton: mockChangeIsClickChangeButton,
                selectedBreadcrumb: null,
                handleBreadcrumbClick: jest.fn(),
                handlePopupClose: jest.fn(),
                handlePopupContinue: jest.fn(),
            });

            const props = createProps(BreadcrumbsPage.Payment);

            render(<Breadcrumbs {...props} />);

            const wrapper = screen.getByTestId('bread-crumbs-wrapper');
            expect(wrapper).not.toHaveClass('lastStep');
        });

        it('should NOT apply bread__extra-space class when isExtrasPage is true but isFlightPlusHotelFunnel is also true', () => {
            mockUseBreadcrumbs.mockReturnValue({
                breadItems: mockBreadItems,
                activeItemIndex: 1,
                isExtrasPage: true,
                isFlightPlusHotelFunnel: true,
                changeIsClickChangeButton: mockChangeIsClickChangeButton,
                selectedBreadcrumb: null,
                handleBreadcrumbClick: jest.fn(),
                handlePopupClose: jest.fn(),
                handlePopupContinue: jest.fn(),
            });

            const props = createProps(BreadcrumbsPage.Extras);

            render(<Breadcrumbs {...props} />);

            const wrapper = screen.getByTestId('bread-crumbs-wrapper');
            expect(wrapper).not.toHaveClass('bread__extra-space');
            expect(wrapper).toHaveClass('fphWrapper');
        });
    });
});

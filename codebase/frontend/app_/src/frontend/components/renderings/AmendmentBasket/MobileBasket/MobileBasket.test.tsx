import React, { PropsWithChildren } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport, useTabletViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';

import MobileBasket, { IMobileBasketProps, SwipeDirection } from './MobileBasket';

let mockStores;
let mockProps;

const createMockProps = (): PropsWithChildren<IMobileBasketProps> => ({
    fields: {
        Continue: mockSitecoreField('Continue'),
        CurrentDetails: mockSitecoreField('CurrentDetails'),
        GoBack: mockSitecoreField('GoBack'),
        HideDetails: mockSitecoreField('HideDetails'),
        NewDetails: mockSitecoreField('NewDetails'),
        SeeDetails: mockSitecoreField('SeeDetails'),
        HotelDetails: mockSitecoreField('HotelDetails'),
    },
    handleSubmit: jest.fn(),
    hasOptionSelected: false,
    applyNegativeMargin: false,
    price: 100,
    showPrice: true,
    isOnlyBackButton: false,
    children: <div data-tid='child-basket' />,
    rendering: 'rendering',
    params: {},
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/useMediaQuery');

const mockEventData = {
    event: {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
    },
    dir: SwipeDirection.Down,
    deltaY: -100,
    absY: 100,
};

jest.mock('react-swipeable', () => ({
    __esModule: true,
    Swipeable: ({ children, ...props }) => (
        <div
            data-tid='react-swipeable-zone'
            onMouseUp={() => props.onSwiped(mockEventData)}
            onMouseMove={() => props.onSwiping(mockEventData)}
        >
            {children}
        </div>
    ),
}));

const mockPlaceholder = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholder(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('frontend/components/common/StickyBox', () => ({
    __esModule: true,
    default: props => <div data-tid='sticky-box'>{props.render()}</div>,
}));

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: props => {
        mockCalloutProps(props);

        return <div data-tid='callout' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button {...props} />;
    },
}));

jest.mock('frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer', () => ({
    __esModule: true,
    default: ({ isOpened, children }: any) => (isOpened ? <div>{children}</div> : null),
}));

describe('<MobileBasket />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    const openDrawer = async () => {
        const seeDetailsButton = screen.getByText(mockProps.fields.SeeDetails.value);
        await userEvent.click(seeDetailsButton);
    };

    describe('Static Footer', () => {
        it('should render static footer correctly when no item is selected', () => {
            render(<MobileBasket {...mockProps} />);

            const goBackLink = screen.getByText(mockProps.fields.GoBack.value);
            expect(goBackLink).toBeInTheDocument();
            expect(goBackLink).toHaveAttribute('href', SitePath.ViewBooking);
            const continueButton = screen.getByText(mockProps.fields.Continue.value);
            expect(continueButton).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    disabled: true,
                    className: 'continueButton',
                    dataTid: 'basket-continue-button',
                }),
            );
            expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(mockProps.price, {
                currency: CurrencyCode.GBP,
            });
            expect(screen.getByTestId('basket-static-footer')).toHaveClass('staticFooter');
        });

        it('should NOT render static footer with isStaticFooterIncluded prop is false', () => {
            mockProps.isStaticFooterIncluded = false;

            render(<MobileBasket {...mockProps} />);

            expect(screen.queryByTestId('basket-static-footer')).not.toBeInTheDocument();
        });

        it('should render static footer when item is selected', () => {
            mockProps.hasOptionSelected = true;

            render(<MobileBasket {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.GlobalsPriceLabelsTotal)).toBeInTheDocument();
            expect(screen.getByTestId('mobile-basket-price')).toHaveTextContent('£100');
            expect(screen.queryByText(mockProps.fields.GoBack.value)).not.toBeInTheDocument();
            const continueButton = screen.getByText(mockProps.fields.Continue.value);
            expect(continueButton).toBeInTheDocument();
            expect(continueButton).not.toHaveClass('btn--disabled');
            expect(screen.getByTestId('basket-static-footer')).toHaveClass('staticFooter withPriceLabel');
        });

        it('should call handleSubmit when Continue button is clicked', async () => {
            mockProps.hasOptionSelected = true;

            render(<MobileBasket {...mockProps} />);

            const continueButton = screen.getByText(mockProps.fields.Continue.value);
            await userEvent.click(continueButton);
            expect(mockProps.handleSubmit).toHaveBeenCalled();
        });

        it('should render Link with backLink when backLink is passed', () => {
            mockProps.backLink = SitePath.AmendDatesSummary;

            render(<MobileBasket {...mockProps} />);

            expect(screen.getByTestId('mobile-basket-back-link')).toHaveTextContent(mockProps.fields.GoBack.value);
            const goBackLink = screen.getByText(mockProps.fields.GoBack.value);
            expect(goBackLink).toHaveAttribute('href', SitePath.AmendDatesSummary);
        });

        it('should render Callout in PriceLabel if calloutProps are passed', () => {
            mockProps.hasOptionSelected = true;
            mockProps.calloutProps = { position: CalloutPosition.Center, orientation: CalloutOrientation.Bottom };

            render(<MobileBasket {...mockProps} />);

            expect(mockCalloutProps).toHaveBeenCalledWith(mockProps.calloutProps);
            expect(screen.getByTestId('callout')).toBeInTheDocument();
        });
    });

    describe('Details Drawer', () => {
        it('should render details drawer when See Details button is clicked', async () => {
            const { container } = render(<MobileBasket {...mockProps} />);

            await openDrawer();

            expect(screen.getByText(mockProps.fields.CurrentDetails.value)).toBeInTheDocument();
            expect(screen.getByTestId('child-basket')).toBeInTheDocument();
            expect(screen.getByText(mockProps.fields.HideDetails.value)).toBeInTheDocument();
            expect(container.querySelector('.greyOverlay')).toBeInTheDocument();
        });

        it('should hide details drawer when Hide Details button is clicked', async () => {
            render(<MobileBasket {...mockProps} />);

            await openDrawer();

            const hideDetailsButton = screen.getByText(mockProps.fields.HideDetails.value);
            await userEvent.click(hideDetailsButton);

            await waitFor(() => {
                expect(screen.queryByText(mockProps.fields.CurrentDetails.value)).not.toBeInTheDocument();
                expect(screen.queryByTestId('child-basket')).not.toBeInTheDocument();
                expect(screen.getByText(mockProps.fields.SeeDetails.value)).toBeInTheDocument();
            });
        });

        it('should show NewDetails when item is selected', async () => {
            mockProps.hasOptionSelected = true;

            render(<MobileBasket {...mockProps} />);

            await openDrawer();

            expect(screen.getByText(mockProps.fields.NewDetails.value)).toBeInTheDocument();
        });

        it('should hide details drawer when click outside', async () => {
            const { container } = render(<MobileBasket {...mockProps} />);

            await openDrawer();

            const background = container.querySelector('.greyOverlay');

            await userEvent.click(background!);

            await waitFor(() => {
                expect(screen.queryByText(mockProps.fields.CurrentDetails.value)).not.toBeInTheDocument();
                expect(screen.queryByTestId('child-basket')).not.toBeInTheDocument();
                expect(screen.getByText(mockProps.fields.SeeDetails.value)).toBeInTheDocument();
            });
        });

        it('should hide the details drawer when clicking on the static footer', async () => {
            render(<MobileBasket {...mockProps} />);

            await openDrawer();

            const footerContainer = screen.getByTestId('basket-static-footer');
            await userEvent.click(footerContainer);

            await waitFor(() => {
                expect(screen.queryByText(mockProps.fields.CurrentDetails.value)).not.toBeInTheDocument();
                expect(screen.queryByTestId('child-basket')).not.toBeInTheDocument();
                expect(screen.getByText(mockProps.fields.SeeDetails.value)).toBeInTheDocument();
            });
        });

        it('should hide the details drawer when clicking on the Hide Details button', async () => {
            render(<MobileBasket {...mockProps} />);

            await openDrawer();

            const hideDetailsButton = screen.getByText(mockProps.fields.HideDetails.value);

            await userEvent.click(hideDetailsButton);

            // FIX: Use queryByText for negative assertions
            await waitFor(() => {
                expect(screen.queryByText(mockProps.fields.CurrentDetails.value)).not.toBeInTheDocument();
                expect(screen.queryByTestId('child-basket')).not.toBeInTheDocument();
                expect(screen.getByText(mockProps.fields.SeeDetails.value)).toBeInTheDocument();
            });
        });

        it('should set body overflow as hidden when details drawer is open', async () => {
            render(<MobileBasket {...mockProps} />);

            await openDrawer();

            expect(document.body).toHaveStyle('overflow: hidden');
        });

        it('should reset body overflow on unmount', async () => {
            const { unmount } = render(<MobileBasket {...mockProps} />);

            await openDrawer();

            expect(document.body).toHaveStyle('overflow: hidden');

            unmount();

            expect(document.body).not.toHaveStyle('overflow: hidden');
        });
    });

    describe('Swiping behaviour', () => {
        it('should close the drawer when swiped down', async () => {
            render(<MobileBasket {...mockProps} />);

            await openDrawer();

            const swiper = screen.getByTestId('react-swipeable-zone');
            fireEvent.mouseMove(swiper);

            expect(screen.getByTestId('basket-details-drawer')).toHaveStyle(`transform: translateY(100px)`);

            fireEvent.mouseUp(swiper);

            // FIX: Use queryByText for negative assertions
            await waitFor(() => {
                expect(screen.queryByText(mockProps.fields.CurrentDetails.value)).not.toBeInTheDocument();
                expect(screen.queryByTestId('child-basket')).not.toBeInTheDocument();
                expect(screen.getByText(mockProps.fields.SeeDetails.value)).toBeInTheDocument();
            });
        });

        it('Should NOT close the drawer when swiped up', async () => {
            mockEventData.dir = SwipeDirection.Up;
            mockEventData.deltaY = 100;

            render(<MobileBasket {...mockProps} />);

            await openDrawer();

            const swiper = screen.getByTestId('react-swipeable-zone');
            fireEvent.mouseMove(swiper);

            expect(screen.getByTestId('basket-details-drawer')).toHaveStyle(`transform: translateY(0px)`);

            fireEvent.mouseUp(swiper);

            // These are positive assertions, so getByText is fine here
            await waitFor(() => {
                expect(screen.getByText(mockProps.fields.CurrentDetails.value)).toBeInTheDocument();
                expect(screen.queryByTestId('child-basket')).toBeInTheDocument();
                expect(screen.getByText(mockProps.fields.HideDetails.value)).toBeInTheDocument();
            });
        });
    });

    it('should never render price when showPrice is false', () => {
        mockProps.showPrice = false;
        mockProps.hasOptionSelected = true;

        render(<MobileBasket {...mockProps} />);

        expect(screen.queryByText(SitecoreDictionary.GlobalsPriceLabelsTotal)).not.toBeInTheDocument();
        expect(screen.queryByText('£100')).not.toBeInTheDocument();
    });

    it('should render null if no fields are passed', () => {
        mockProps.fields = null;

        const { container } = render(<MobileBasket {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render formatted price, even if it is 0', async () => {
        mockProps.price = 0;
        mockProps.hasOptionSelected = true;

        render(<MobileBasket {...mockProps} />);

        expect(screen.getByText('£0')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholder).toHaveBeenCalledWith({
            name: PlaceholderNames.ChangeFeeInfo,
            rendering: mockProps.rendering,
        });
    });

    it('should render correct header title for isHotelDetailsIncluded', async () => {
        mockProps.isHotelDetailsIncluded = true;

        render(<MobileBasket {...mockProps} />);

        await openDrawer();

        expect(screen.getByText(mockProps.fields.HotelDetails.value)).toBeInTheDocument();
    });

    it('should NOT render continue button when isOnlyBackButton prop is true', () => {
        mockProps.isOnlyBackButton = true;

        render(<MobileBasket {...mockProps} />);

        expect(screen.queryByTestId('basket-continue-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('basket-static-footer')).toHaveClass('staticFooter withOnlyBackButton');
    });

    it('should apply padding to body element on tablet', () => {
        jest.mocked(useTabletViewport).mockReturnValue(true);

        render(<MobileBasket {...mockProps} />);

        expect(document.body.style.paddingBottom).toBe('72px');
    });

    it('should apply padding to body element on mobile', async () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);

        render(<MobileBasket {...mockProps} />);

        expect(document.body.style.paddingBottom).toBe('100px');
    });
});

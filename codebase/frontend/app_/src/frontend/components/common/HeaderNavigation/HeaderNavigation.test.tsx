import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import INavLink from 'models/data/INavLink';
import { ShowOn } from 'models/enum/ShowOn';

import HeaderNavigation, { IHeaderNavigationProps } from './HeaderNavigation';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/static/PageHeader/components/ShortlistLink/ShortlistLink', () => () => (
    <div data-tid='shortlist-link' />
));

const mockMenuItemProps = jest.fn();
jest.mock('frontend/components/renderings/static/PageHeader/components/MenuItem', () => ({
    __esModule: true,
    default: props => {
        mockMenuItemProps(props);

        return <li data-tid='menu-item' />;
    },
}));
const resetMocks = (): IHeaderNavigationProps => ({
    fields: {
        MenuAriaLabel: mockSitecoreField('Menu'),
        PrimaryNavigationAriaLabel: mockSitecoreField('PrimaryNavigationAriaLabel'),
        ActionNavigationAriaLabel: mockSitecoreField('ActionNavigationAriaLabel'),
        MainNav: [{ id: '' } as INavLink],
        SecondaryNav: [{ id: '' } as INavLink],
        LogoLink: mockSitecoreField(mockSitecoreLinkField('logo-link')),
        Logo: mockSitecoreField(mockSitecoreImageField('logo')),
    },
    setMainRef: jest.fn(),
    setSecondaryRef: jest.fn(),
    burgerClassName: '',
    onToggleHeaderMenu: jest.fn(),
    isOpen: false,
});
const resetMockStores = () =>
    createMockStores({
        userStore: {
            isLoggedIn: false,
        },
        reCaptchaStore: {
            toggleReCaptchaBadge: jest.fn(),
        },
        layoutStore: {
            isMobileAppHideFeatures: false,
            isViewBookingPage: false,
            isConfirmationPage: false,
        },
        viewBookingStore: {
            booking: {} as any,
        },
        bookingStore: {
            booking: {} as any,
            isCheckInAvailable: jest.fn(() => false),
        },
    });

let mockProps: IHeaderNavigationProps;
let mockStores;

describe('<HeaderNavigation />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = resetMockStores();
    });

    it('should add class to body and hide captcha when menu is opened on mobile', async () => {
        const { container } = render(<HeaderNavigation {...mockProps} />);

        const button = container.querySelector('.header__burger__btn');

        await userEvent.click(button!);

        expect(document.body.classList.contains('overflow-hidden')).toEqual(true);
        expect(mockStores.reCaptchaStore.toggleReCaptchaBadge).toHaveBeenCalledWith(false);
    });

    it('should expand menu when isOpen is true on mobile', async () => {
        mockProps.isOpen = true;
        const { container } = render(<HeaderNavigation {...mockProps} />);

        const button = container.querySelector('.header__burger__btn');

        await userEvent.click(button!);

        expect(container.querySelector('.header__nav.opened')).toBeInTheDocument();
    });

    describe('renderMobileShortlistLink', () => {
        it('should NOT render ShortlistLink if link is NOT ShortListLink', () => {
            mockProps.fields.SecondaryNav = [
                {
                    fields: {
                        IsShortList: undefined,
                    },
                } as INavLink,
            ];

            render(<HeaderNavigation {...mockProps} />);

            expect(screen.queryByTestId('shortlist-link')).not.toBeInTheDocument();
        });

        it('should NOT render ShortlistLink if showOnValue is NOT ShowOnMobile', () => {
            mockProps.fields.SecondaryNav = [
                {
                    fields: {
                        IsShortList: mockSitecoreField(true),
                        ShowOn: {
                            value: ShowOn.ShowOnDesktop,
                        },
                    },
                } as INavLink,
            ];

            render(<HeaderNavigation {...mockProps} />);

            expect(screen.queryByTestId('shortlist-link')).not.toBeInTheDocument();
        });

        it('should render ShortlistLink if link is ShortListLink and showOnValue is ShowOnMobile', () => {
            mockProps.fields.SecondaryNav = [
                {
                    fields: {
                        IsShortList: mockSitecoreField(true),
                        ShowOn: {
                            value: ShowOn.ShowOnMobile,
                        },
                    },
                } as INavLink,
            ];

            render(<HeaderNavigation {...mockProps} />);

            expect(screen.getByTestId('shortlist-link')).toBeInTheDocument();
        });

        it('should render ShortlistLink if link is ShortListLink and showOnValue is not set', () => {
            mockProps.fields.SecondaryNav = [
                {
                    fields: {
                        IsShortList: mockSitecoreField(true),
                    },
                } as INavLink,
            ];

            render(<HeaderNavigation {...mockProps} />);

            expect(screen.getByTestId('shortlist-link')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should render aria-labelledby for nav tags', () => {
            const { container } = render(<HeaderNavigation {...mockProps} />);

            const navigationActions = container.querySelector('.header__actions .navigation');
            const navigation = container.querySelector('.header__nav .navigation');
            expect(navigation).toHaveAttribute('aria-label', mockProps.fields.PrimaryNavigationAriaLabel.value);
            expect(navigationActions).toHaveAttribute('aria-label', mockProps.fields.ActionNavigationAriaLabel.value);
        });

        it('Should render aria-label fro burger menu button', () => {
            const { container } = render(<HeaderNavigation {...mockProps} />);

            const burgerButton = container.querySelector('.header__burger__btn');

            expect(burgerButton).toHaveAttribute('aria-label', mockProps.fields.MenuAriaLabel.value);
            expect(burgerButton).toHaveAttribute('aria-controls', 'menu');
            expect(burgerButton).toHaveAttribute('aria-expanded', 'false');
        });

        it('Should trigger burger menu button aria-expanded to true when isOpen is true', async () => {
            mockProps.isOpen = true;
            const { container } = render(<HeaderNavigation {...mockProps} />);

            expect(container.querySelector('.header__burger__btn')).toHaveAttribute('aria-expanded', 'true');
        });
    });
});

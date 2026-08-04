import React, { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ShowOn } from 'models/enum/ShowOn';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { MenuItem } from './MenuItem';

jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, className, onClick, ariaLabel }: any) => (
        <a href='#' className={className} aria-label={ariaLabel} onClick={e => onClick?.(e)}>
            {children}
        </a>
    ),
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: (props: any) => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

jest.mock('./ShortlistLink/ShortlistLink', () => () => <div data-tid='shortlist-link' />);

const linkField = {
    value: {
        href: 'test',
        text: 'test',
        linktype: SitecoreLinkType.Internal,
    },
};

let mockStores;
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./ShortlistLink/ShortlistLink', () => () => <div data-tid='shortlist-link' />);

jest.mock('./SubMenuItem', () => ({
    __esModule: true,
    default: () => (
        <div data-tid='sub-menu-item'>
            <button className='destination-menu__list-promotional-link'>Promo text from link</button>
        </div>
    ),
}));

jest.mock('frontend/utils/navigation.utils', () => ({
    ...jest.requireActual('frontend/utils/navigation.utils'),
    isRedeemVoucherItem: jest.fn(() => false),
}));

describe('<MenuItem/>', () => {
    const resetMocks = () =>
        ({
            item: {
                id: '',
                fields: {
                    Link: linkField,
                    ChildrenLinks: [
                        {
                            id: '',
                            fields: {
                                Link: linkField,
                            },
                        },
                    ],
                },
            },
            onClick: jest.fn(),
            onLogout: jest.fn(),
            isScreenLarge: true,
            isUserLinkValid: jest.fn(() => true),
            trackNavigationClick: jest.fn(),
            isActionMenu: true,
            creditBalance: [
                {
                    balance: 100,
                    currency: 'GBP',
                },
            ],
            marketCredit: {
                balance: 100,
                currency: 'GBP',
                hasCreditHistory: true,
            },
            isCreditBookingEnabled: true,
            isCreditEnabledApiSettings: true,
            isCreditLoading: false,
            isLoggedIn: true,
            fetchMyCreditBalance: jest.fn(),
            formatMoney: jest.fn(a => `£${a}${a % 1 === 0 ? '.00' : ''}`),
            wasRerendered: true,
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();

        mockStores = mockStores = {
            layoutStore: {
                isPromoPage: false,
                isHomePage: false,
                isGiftCardRedemptionEnabled: true,
                isScreenLarge: true,
            },
            appStore: {
                isScreenLarge: true,
            },
            userStore: {
                onLogout: jest.fn(),
            },
            holidayCreditStore: {
                hasCreditHistory: true,
                creditBalance: [{ balance: 100, currency: 'GBP' }],
                marketCredit: { balance: 100, currency: 'GBP', hasCreditHistory: true },
                isCreditBookingEnabled: true,
                isCreditEnabledApiSettings: true,
            },
            trackingStore: {
                trackNavigationClick: jest.fn(),
                trackEventWithParams: jest.fn(),
            },
            marketStore: {
                formatMoney: (amount: number) => `£${amount}${amount % 1 === 0 ? '.00' : ''}`,
            },
        };
    });

    it('should NOT render when fields are null', () => {
        mocks.item = { id: 'x', fields: null } as any;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );

        expect(container.querySelector('li')).toBeNull();
    });

    describe('Mounting', () => {
        it('should be closed on mount', () => {
            mocks.isActionMenu = false;
            const { container } = render(
                <ul>
                    <MenuItem {...mocks} />
                </ul>,
            );

            expect(container.querySelector('.destination-menu')).toBeTruthy();
            expect(container.querySelector('.destination-menu')!.classList.contains('is-shown')).toBe(false);
        });

        it('should open submenu on click on small devices (non-action menu)', async () => {
            mocks.isActionMenu = false;
            mocks.isScreenLarge = false;

            const { container } = render(
                <ul>
                    <MenuItem {...mocks} />
                </ul>,
            );

            const parentLink = container.querySelector('.parent-link') as HTMLElement;
            await userEvent.click(parentLink);

            expect(container.querySelector('.destination-menu')!.classList.contains('is-shown')).toBe(true);
        });
    });

    it('should call onClick on large devices (has children, not action menu)', async () => {
        mocks.isActionMenu = false;
        mocks.isScreenLarge = true;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );
        const parentLink = container.querySelector('.parent-link') as HTMLElement;

        await userEvent.click(parentLink);

        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should handle onClick when clicked on small devices and NO children found', async () => {
        mocks.isActionMenu = false;
        mocks.isScreenLarge = false;
        mocks.item.fields.ChildrenLinks = null;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );
        const parentLink = container.querySelector('.parent-link') as HTMLElement;
        await userEvent.click(parentLink);

        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should NOT handle onClick when clicked on small devices and children found', async () => {
        mocks.isActionMenu = false;
        mocks.isScreenLarge = false;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );
        const parentLink = container.querySelector('.parent-link') as HTMLElement;

        await userEvent.click(parentLink);

        expect(mocks.onClick).not.toHaveBeenCalled();
        expect(container.querySelector('.destination-menu')!.classList.contains('is-shown')).toBe(true);
    });

    it('should render class for action buttons', () => {
        mocks.item = { id: 'x', fields: { Link: linkField } } as any;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );

        expect(container.querySelector('li.navigation__button')).toBeTruthy();
    });

    it('should render class for action images', () => {
        mocks.item = { id: 'x', fields: { Link: linkField, Image: { value: { src: '/img.png' } } } } as any;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );

        expect(container.querySelector('li.navigation__link--icon')).toBeTruthy();
    });

    it('should render mobile-button for user action link when ShowOn=ShowOnLogedIn', () => {
        mocks.isLoggedIn = true;
        mocks.item = {
            id: 'x',
            fields: { Link: linkField, ShowOn: { value: ShowOn.ShowOnLogedIn } },
        } as any;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );

        expect(container.querySelector('li.mobile-button')).toBeTruthy();
    });

    it('should render logged_in-action class for non-action users link with ShowOn', () => {
        mocks.isActionMenu = false;
        mocks.item = {
            id: 'x',
            fields: { Link: linkField, ShowOn: { value: ShowOn.ShowOnLogedIn } },
        } as any;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );

        expect(container.querySelector('li.logged_in-action')).toBeTruthy();
    });

    it("should render class for non-action user's link (logged_in-action)", () => {
        mocks.isActionMenu = false;
        mocks.item = {
            id: 'x',
            fields: { Link: linkField, ShowOn: { value: ShowOn.ShowOnLogedIn } },
        };

        const { container } = render(<MenuItem {...mocks} />);

        expect(container.querySelector('li.logged_in-action')).toBeTruthy();
    });

    it('should render class for collapsible link', () => {
        mocks.isActionMenu = false;
        mocks.item = {
            id: 'x',
            fields: {
                Link: linkField,
                ChildrenLinks: [{ id: 'c1', fields: { Link: linkField } }],
            },
        };

        const { container } = render(<MenuItem {...mocks} />);

        expect(container.querySelector('li.has-children')).toBeTruthy();
        expect(container.querySelector('.destination-menu__container')!.classList.contains('has-full-width')).toBe(
            true,
        );
    });

    it("should render class for unavailable (invalid) user's link", () => {
        mocks.isUserLinkValid = jest.fn(() => false);

        const { container } = render(<MenuItem {...mocks} />);

        expect(container.querySelector('li.is-empty')).toBeTruthy();
    });

    it('should open on click action collapsible link', async () => {
        const user = userEvent.setup();

        mocks.isActionMenu = true;
        mocks.isScreenLarge = false;

        const { container } = render(<MenuItem {...mocks} />);
        const parentLink = container.querySelector('.parent-link') as HTMLElement;

        await user.click(parentLink);

        expect(parentLink.parentElement!.querySelector('ul.is-shown')).toBeTruthy();
    });

    it('should render class navigation__button when ShowOn is ShowOnIfAvailableToCheckIn', () => {
        mocks.item = {
            id: 'x',
            fields: {
                Link: linkField,
                ShowOn: {
                    value: ShowOn.ShowOnIfAvailableToCheckIn,
                },
            },
        } as any;

        const { container } = render(
            <ul>
                <MenuItem {...mocks} />
            </ul>,
        );

        expect(container.querySelector('.navigation__button')).toBeInTheDocument();
    });

    describe('Menu Toggling Interaction', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        it('should NOT open menu on click if ChildrenLinks is missing', async () => {
            mocks.isScreenLarge = false;
            mocks.isActionMenu = false;
            delete mocks.item.fields.ChildrenLinks;

            const { container } = render(
                <ul>
                    <MenuItem {...mocks} />
                </ul>,
            );

            const parentLink = container.querySelector('.parent-link') as HTMLElement;
            await fireEvent.click(parentLink);

            expect(container.querySelector('.destination-menu')).not.toBeInTheDocument();
        });

        it('should NOT open menu on click if ChildrenLinks is empty', async () => {
            mocks.isScreenLarge = false;
            mocks.isActionMenu = false;
            mocks.item.fields.ChildrenLinks = [];

            const { container } = render(
                <ul>
                    <MenuItem {...mocks} />
                </ul>,
            );

            const parentLink = container.querySelector('.parent-link') as HTMLElement;
            await fireEvent.click(parentLink);

            expect(container.querySelector('.destination-menu')).not.toBeInTheDocument();
        });

        it('should NOT open menu on click if screen is large and item is not in action menu', async () => {
            mocks.isScreenLarge = true;
            mocks.isActionMenu = false;
            mocks.item.fields.ChildrenLinks = [{ id: 'c1', fields: { Link: linkField } }];

            const { container } = render(
                <ul>
                    <MenuItem {...mocks} />
                </ul>,
            );

            const parentLink = container.querySelector('.parent-link') as HTMLElement;

            await fireEvent.click(parentLink);

            act(() => {
                jest.runAllTimers();
            });
            const menu = container.querySelector('.destination-menu');

            expect(menu).toBeInTheDocument();
            expect(menu).not.toHaveClass('is-shown');
        });

        it('should toggle menu open on click (Mobile/Small Screen)', async () => {
            mocks.isScreenLarge = false;
            mocks.isActionMenu = false;
            mocks.item.fields.ChildrenLinks = [{ id: 'c1', fields: { Link: linkField } }];

            const { container } = render(
                <ul>
                    <MenuItem {...mocks} />
                </ul>,
            );

            const parentLink = container.querySelector('.parent-link') as HTMLElement;
            const menu = container.querySelector('.destination-menu');

            expect(menu).not.toHaveClass('is-shown');

            fireEvent.click(parentLink);
            act(() => {
                jest.runAllTimers();
            });

            expect(menu).toHaveClass('is-shown');

            const goBackButton = container.querySelector('.go-back') as HTMLElement;

            expect(goBackButton).toBeInTheDocument();

            fireEvent.click(goBackButton);
            act(() => {
                jest.runAllTimers();
            });

            expect(menu).not.toHaveClass('is-shown');
        });
    });

    describe('trackPromoComponent', () => {
        it('should use promotional link text as eventLabel when tracking promo banner', async () => {
            mocks.isActionMenu = false;
            mocks.isScreenLarge = true;
            mocks.isHomePage = true;
            mocks.trackEventWithParams = jest.fn();
            mocks.item.fields.PromotionalComponent = {
                fields: {
                    Title: mockSitecoreField('Field title fallback'),
                },
            };

            render(<MenuItem {...mocks} />);

            await userEvent.hover(screen.getByTestId('menu-item'));

            expect(mocks.trackEventWithParams).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ eventLabel: 'Promo text from link' }),
                expect.anything(),
            );
        });

        it('should track promo banner only once', async () => {
            mocks.isActionMenu = false;
            mocks.isScreenLarge = true;
            mocks.isHomePage = true;
            mocks.trackEventWithParams = jest.fn();

            render(<MenuItem {...mocks} />);

            const menuItem = screen.getByTestId('menu-item');

            await userEvent.hover(menuItem);
            await userEvent.unhover(menuItem);
            await userEvent.hover(menuItem);

            expect(mocks.trackEventWithParams).toHaveBeenCalledTimes(1);
        });
    });

    describe('credit item', () => {
        const creditItem = {
            id: '',
            fields: {
                ChildrenLinks: [
                    {
                        id: '',
                        fields: {
                            Link: {
                                value: {
                                    href: '/booking/holiday-credit',
                                    text: 'Available credit',
                                    linktype: SitecoreLinkType.Internal,
                                },
                            },
                        },
                    },
                ],
                Link: {
                    value: {
                        href: '/link/new',
                        text: 'Test link',
                        linktype: SitecoreLinkType.Internal,
                    },
                },
            },
        };

        it('should render credit amount when user has credit', () => {
            mocks.item = creditItem;

            render(<MenuItem {...mocks} />);

            expect(screen.queryByText('£100.00')).toBeInTheDocument();
        });

        it('should not render credit amount when user has not credit history', () => {
            mocks.item = creditItem;
            mocks.marketCredit = {
                balance: 0,
                currency: 'GBP',
                hasCreditHistory: false,
            };

            render(<MenuItem {...mocks} />);

            expect(screen.queryByText('Available credit')).toBeInTheDocument();
            expect(screen.queryByText('£0.00')).not.toBeInTheDocument();
        });

        it('should render zero amount when user has zero balance and have credit history', () => {
            mocks.item = creditItem;
            mocks.marketCredit = {
                balance: 0,
                currency: 'GBP',
                hasCreditHistory: true,
            };

            render(<MenuItem {...mocks} />);

            expect(screen.queryByText('£0.00')).toBeInTheDocument();
        });

        it('should not render credit amount when user has credit in few markets', () => {
            mocks.item = creditItem;
            mocks.creditBalance = [
                {
                    balance: 100,
                    currency: 'GBP',
                },
                {
                    balance: 100,
                    currency: 'CHF',
                },
            ];

            render(<MenuItem {...mocks} />);

            expect(screen.queryByText('Available credit')).toBeInTheDocument();
            expect(screen.queryByText('£100.00')).not.toBeInTheDocument();
        });

        it('should lazily fetch the balance when the menu opens and it is not loaded yet', async () => {
            mocks.item = creditItem;
            mocks.creditBalance = null;

            render(<MenuItem {...mocks} />);

            await userEvent.hover(screen.getByTestId('menu-item'));

            expect(mocks.fetchMyCreditBalance).toHaveBeenCalledWith(false, true);
        });

        it('should NOT fetch the balance again when it is already loaded', async () => {
            mocks.item = creditItem;

            render(<MenuItem {...mocks} />);

            await userEvent.hover(screen.getByTestId('menu-item'));

            expect(mocks.fetchMyCreditBalance).not.toHaveBeenCalled();
        });

        it('should NOT fetch the balance on open when credit booking is disabled', async () => {
            mocks.item = creditItem;
            mocks.creditBalance = null;
            mocks.isCreditBookingEnabled = false;

            render(<MenuItem {...mocks} />);

            await userEvent.hover(screen.getByTestId('menu-item'));

            expect(mocks.fetchMyCreditBalance).not.toHaveBeenCalled();
        });

        it('should NOT fetch the balance on open when the user is logged out', async () => {
            mocks.item = creditItem;
            mocks.creditBalance = null;
            mocks.isLoggedIn = false;

            render(<MenuItem {...mocks} />);

            await userEvent.hover(screen.getByTestId('menu-item'));

            expect(mocks.fetchMyCreditBalance).not.toHaveBeenCalled();
        });

        it('should NOT fetch the balance on open when the menu has no holiday credit item', async () => {
            // default item's children are not holiday-credit links
            mocks.creditBalance = null;

            render(<MenuItem {...mocks} />);

            await userEvent.hover(screen.getByTestId('menu-item'));

            expect(mocks.fetchMyCreditBalance).not.toHaveBeenCalled();
        });

        it('should show a loading shimmer on the credit item while the balance is loading', () => {
            mocks.item = creditItem;
            mocks.isCreditLoading = true;
            // not yet known to be enabled — the row must still render (and show the loader) while loading
            mocks.isCreditEnabledApiSettings = false;

            render(<MenuItem {...mocks} />);

            expect(screen.getByTestId('credit-balance-loading')).toBeInTheDocument();
            expect(screen.queryByText('£100.00')).not.toBeInTheDocument();
        });

        it('should NOT render the credit item when credit booking is disabled', () => {
            mocks.item = creditItem;
            mocks.isCreditBookingEnabled = false;

            render(<MenuItem {...mocks} />);

            expect(screen.queryByText('Available credit')).not.toBeInTheDocument();
        });

        it('should NOT render the credit item when API reports credit disabled and not loading', () => {
            mocks.item = creditItem;
            mocks.isCreditEnabledApiSettings = false;
            mocks.isCreditLoading = false;

            render(<MenuItem {...mocks} />);

            expect(screen.queryByText('Available credit')).not.toBeInTheDocument();
        });
    });

    describe('Log Out item', () => {
        it('Should render logout action as a button and call logout handler on click on mobile', async () => {
            mocks.item.fields.Link = {
                value: {
                    href: '/',
                    text: 'Log out',
                    anchor: '',
                    linktype: 'internal',
                    class: '',
                    title: '',
                    querystring: 'logout=1',
                    id: '{0518D8C6-B7CA-4C73-86C2-A29D971EBEAB}',
                },
            };

            render(<MenuItem {...mocks} />);

            const logOutButton = screen.getByRole('button', { name: 'Log out' });

            expect(logOutButton).toBeInTheDocument();

            await userEvent.click(logOutButton);

            expect(mocks.onLogout).toHaveBeenCalled();
        });

        it('Should render logout action as a button and call logout handler on click on desktop', async () => {
            mocks.item.fields.ChildrenLinks = [
                {
                    id: '47394f9e-26c4-4539-aad7-5280c89f6d2c',
                    fields: {
                        Link: {
                            value: {
                                href: '/',
                                text: 'Log out',
                                anchor: '',
                                linktype: 'internal',
                                class: '',
                                title: '',
                                querystring: 'logout=1',
                                id: '{0518D8C6-B7CA-4C73-86C2-A29D971EBEAB}',
                            },
                        },
                    },
                },
            ];

            render(<MenuItem {...mocks} />);

            const logOutButton = screen.getByRole('button', { name: 'Log out' });

            expect(logOutButton).toBeInTheDocument();

            await userEvent.click(logOutButton);

            expect(mocks.onLogout).toHaveBeenCalled();
        });
    });

    it('should render JSSNextImage', () => {
        mocks.item.fields.Image = 'Image';

        render(<MenuItem {...mocks} />);

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mocks.item.fields.Image,
                width: 31,
                height: 31,
                mediaSize: MediaSize.Small,
            }),
        );
    });

    describe('renderDesktopShortlistLink', () => {
        beforeEach(() => {
            mocks.item.fields.IsShortList = mockSitecoreField(true);
            mocks.isScreenLarge = true;
        });

        it('should NOT render ShortlistLink if link is NOT ShortListLink', () => {
            mocks.item.fields.IsShortList = undefined;

            render(<MenuItem {...mocks} />);

            expect(screen.queryByTestId('shortlist-link')).not.toBeInTheDocument();
        });

        it('should NOT render ShortlistLink if showOnValue is NOT ShowOnDesktop', () => {
            mocks.item.fields = {
                IsShortList: mockSitecoreField(true),
                ShowOn: {
                    value: ShowOn.ShowOnMobile,
                },
            };

            render(<MenuItem {...mocks} />);

            expect(screen.queryByTestId('shortlist-link')).not.toBeInTheDocument();
        });

        it('should render ShortlistLink if link is ShortListLink and showOnValue is ShowOnDesktop', () => {
            mocks.fields = {
                IsShortList: mockSitecoreField(true),
                ShowOn: {
                    value: ShowOn.ShowOnDesktop,
                },
            };

            render(<MenuItem {...mocks} />);

            expect(screen.getByTestId('shortlist-link')).toBeInTheDocument();
            expect(screen.getByTestId('shortlist-link').parentElement).toHaveClass('hide-down-lg');
        });

        it('should render ShortlistLink if link is ShortListLink and showOnValue is not set', () => {
            mocks.fields = {
                IsShortList: mockSitecoreField(true),
            };

            render(<MenuItem {...mocks} />);

            expect(screen.getByTestId('shortlist-link')).toBeInTheDocument();
        });
    });

    describe('onKeyDown', () => {
        beforeEach(() => {
            mocks.isActionMenu = false;
            mocks.isScreenLarge = false;
        });

        it('should open and close menu when ArrowDown and ArrowUp keys are pressed accordingly and item has children', () => {
            render(<MenuItem {...mocks} />);

            const menuItem = screen.getByTestId('menu-item');
            const destinationMenu = menuItem.querySelector('.destination-menu');

            expect(destinationMenu).not.toHaveClass('is-shown');

            fireEvent.keyDown(menuItem, { key: 'ArrowDown' });

            expect(destinationMenu).toHaveClass('is-shown');

            fireEvent.keyDown(menuItem, { key: 'ArrowUp' });

            expect(destinationMenu).not.toHaveClass('is-shown');
        });

        it('should NOT toggle menu when non-ArrowDown key is pressed', () => {
            render(<MenuItem {...mocks} />);

            const menuItem = screen.getByTestId('menu-item');
            const destinationMenu = menuItem.querySelector('.destination-menu');

            expect(destinationMenu).not.toHaveClass('is-shown');

            fireEvent.keyDown(menuItem, { key: 'Enter' });

            expect(destinationMenu).not.toHaveClass('is-shown');
        });

        it('should NOT render menu when item has NO children', () => {
            mocks.item.fields.ChildrenLinks = null;

            render(<MenuItem {...mocks} />);

            const menuItem = screen.getByTestId('menu-item');

            expect(menuItem.querySelector('.destination-menu')).toBeNull();
        });

        it('should NOT render menu when item has empty children array', () => {
            mocks.item.fields.ChildrenLinks = [];

            render(<MenuItem {...mocks} />);

            const menuItem = screen.getByTestId('menu-item');

            expect(menuItem.querySelector('.destination-menu')).toBeNull();
        });
    });

    describe('onBlur', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            mocks.isActionMenu = false;
            mocks.isScreenLarge = true;
        });

        afterEach(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });

        it('should close menu when focus leaves menu item', () => {
            render(<MenuItem {...mocks} />);

            const menuItem = screen.getByTestId('menu-item');
            const destinationMenu = menuItem.querySelector('.destination-menu');

            fireEvent.keyDown(menuItem, { key: 'ArrowDown' });
            act(() => {
                jest.runAllTimers();
            });

            expect(destinationMenu).toHaveClass('is-shown');

            fireEvent.blur(menuItem);
            act(() => {
                jest.runAllTimers();
            });

            expect(destinationMenu).not.toHaveClass('is-shown');
        });

        it('should NOT close menu when focus stays within menu item children', async () => {
            render(<MenuItem {...mocks} />);

            const menuItem = screen.getByTestId('menu-item');
            const destinationMenu = menuItem.querySelector('.destination-menu');

            fireEvent.focus(menuItem);
            fireEvent.keyDown(menuItem, { key: 'ArrowDown' });

            fireEvent.focus(screen.getByTestId('sub-menu-item'));
            act(() => {
                jest.runAllTimers();
            });

            expect(destinationMenu).toHaveClass('is-shown');
        });
    });
});

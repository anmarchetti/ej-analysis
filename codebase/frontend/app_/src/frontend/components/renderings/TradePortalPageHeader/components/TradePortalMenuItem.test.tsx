import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ShowOn } from 'models/enum/ShowOn';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import TradePortalMenuItem, { IMenuItemProps } from './TradePortalMenuItem';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ link }) => <button>{link?.value?.text}</button>,
}));

const mockRoleRenderComponent = jest.fn();
jest.mock('./RoleRender/RoleRender', () => ({
    __esModule: true,
    RoleRender: ({ children, ...props }) => {
        mockRoleRenderComponent(props);

        return <div data-tid='role-render'>{children}</div>;
    },
}));

jest.mock('./TradePortalSubMenuItem', () => ({
    __esModule: true,
    default: () => <div data-tid='trade-portal-sub-menu-item' />,
}));

const linkField = {
    value: {
        href: 'test',
        text: 'test',
        linktype: SitecoreLinkType.Internal,
    },
};

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
        isUserLinkValid: jest.fn(() => true),
        trackNavigationClick: jest.fn(),
        isActionMenu: true,
    } as IMenuItemProps);

const createStores = () =>
    createMockStores({
        userStore: {
            isLoggedIn: true,
            onLogout: jest.fn(),
        },
    });

let mocks;
let mockStores;

describe('<MenuItem/>', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should NOT render if fields from Sitecore is null', () => {
        mocks.item.fields = null;
        const { container } = render(<TradePortalMenuItem {...mocks} />);

        expect(container.querySelector('li')).not.toBeInTheDocument();
    });

    it('menu should be closed on mount', () => {
        mocks.isActionMenu = false;
        const { container } = render(<TradePortalMenuItem {...mocks} />);

        expect(container.querySelector('.header_trade__destination-menu')).toBeInTheDocument();
        expect(container.querySelector('.header_trade__destination-menu')).not.toHaveClass('is-open');
    });

    it('should render class for action images', () => {
        mocks.item = {
            id: '',
            fields: {
                Link: linkField,
                Image: { value: { src: '' } },
            },
        };

        const { container } = render(<TradePortalMenuItem {...mocks} />);

        expect(container.querySelector('.header_trade__navigation__link--icon')).toBeInTheDocument();
    });

    it("should render class for non-action user's link", () => {
        mocks.isActionMenu = false;
        mocks.item = {
            id: '',
            fields: {
                Link: linkField,
                ShowOn: {
                    value: ShowOn.ShowOnLogedIn,
                },
            },
        };

        const { container } = render(<TradePortalMenuItem {...mocks} />);

        expect(container.querySelector('.logged_in-action')).toBeInTheDocument();
    });

    it('should render class for collapsible link', () => {
        mocks.isActionMenu = false;
        mocks.item = {
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
        };

        const { container } = render(<TradePortalMenuItem {...mocks} />);

        expect(container.querySelector('.has-children')).toBeInTheDocument();
    });

    it("should render class for unavailable (invalid) user's link", () => {
        mocks.isLoggedIn = false;
        mocks.item = {
            id: '',
            fields: {
                Link: linkField,
                ShowOn: {
                    value: ShowOn.ShowOnLogedIn,
                },
            },
        };
        mocks.isUserLinkValid = jest.fn().mockReturnValue(false);

        const { container } = render(<TradePortalMenuItem {...mocks} />);

        expect(container.querySelector('.is-empty')).toBeInTheDocument();
    });

    it('should render logout icon and text Log out if href option contains TradePortalSitePath.Login', () => {
        mocks.item.fields.ChildrenLinks = [
            {
                id: 'logout-test',
                fields: {
                    Link: {
                        value: { href: '/log-in', text: 'Log out', linkType: SitecoreLinkType },
                    },
                },
            },
        ];
        render(<TradePortalMenuItem {...mocks} />);
        expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    });

    it('Should render logout action as a button and call logout handler on click', async () => {
        mocks.item.fields.ChildrenLinks = [
            {
                fields: {
                    Link: {
                        value: {
                            href: '/',
                            text: 'Log out',
                            querystring: 'logout=1',
                        },
                    },
                },
            },
        ];
        render(<TradePortalMenuItem {...mocks} />);

        const logOutButton = screen.getByRole('button', { name: 'Log out' });
        expect(logOutButton).toBeInTheDocument();

        await userEvent.click(logOutButton);
        expect(mockStores.userStore.onLogout).toHaveBeenCalled();
    });

    it("should render role restricted user's link if there is RoleRestricted field set for link", () => {
        const mockRole = 'Manager';
        mocks.item.fields.ChildrenLinks = [
            {
                id: 'test',
                fields: {
                    Link: linkField,
                    AllowedRoles: [{ fields: { Value: { value: mockRole } } }],
                },
            },
        ];
        render(<TradePortalMenuItem {...mocks} />);
        expect(screen.queryByTestId('role-render')).toBeInTheDocument();
        expect(mockRoleRenderComponent).toHaveBeenCalledWith({ allowedRoles: [mockRole] });
    });

    describe('toggle menu', () => {
        const getMocksWithItem = (text: string, childText?: string) => ({
            ...mocks,
            item: {
                ...mocks,
                fields: {
                    ...mocks.item.fields,
                    Link: mockSitecoreField({ text }),
                    ChildrenLinks: childText
                        ? [
                              {
                                  id: '1',
                                  fields: {
                                      Link: mockSitecoreField({ text: childText }),
                                  },
                              },
                          ]
                        : [],
                },
            },
        });

        describe('changing focus', () => {
            it('should move to the next menu item when no children found', async () => {
                render(
                    <>
                        <TradePortalMenuItem {...getMocksWithItem('test1')} />
                        <TradePortalMenuItem {...getMocksWithItem('test2')} />
                    </>,
                );

                const first = screen.getByText('test1');
                const second = screen.getByText('test2');

                first.focus();
                await userEvent.tab();

                expect(second).toHaveFocus();
            });

            it('should move to the inner menu item when children found', async () => {
                render(
                    <>
                        <TradePortalMenuItem {...getMocksWithItem('test1', 'inner1')} />
                        <TradePortalMenuItem {...getMocksWithItem('test2')} />
                    </>,
                );

                const first = screen.getByText('test1');
                const inner = screen.getByText('inner1');

                await act(async () => {
                    first.focus();
                    await userEvent.tab();
                });

                expect(inner).toHaveFocus();
            });
        });

        describe('mouse events', () => {
            it('should NOT open inner menu initially', async () => {
                render(<TradePortalMenuItem {...getMocksWithItem('test1', 'inner1')} />);

                expect(screen.getByText('inner1')).not.toHaveClass('is-shown');
            });

            it('should open and close inner menu when onMouseEnter', async () => {
                render(<TradePortalMenuItem {...getMocksWithItem('test1', 'inner1')} />);

                await act(async () => {
                    fireEvent.mouseEnter(screen.getByText('test1'));
                });

                waitFor(() => expect(screen.getByText('inner1')).toHaveClass('is-shown'));

                await act(async () => {
                    fireEvent.mouseLeave(screen.getByText('test1'));
                });

                waitFor(() => expect(screen.getByText('inner1')).not.toHaveClass('is-shown'));
            });
        });
    });
});

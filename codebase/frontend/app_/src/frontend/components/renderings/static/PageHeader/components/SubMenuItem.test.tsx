import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { SubMenuItem } from './SubMenuItem';

const createProps = () => ({
    isOpened: true,
    childrenLinks: [
        {
            id: 'id1',
            fields: {
                Link: mockSitecoreField({
                    href: '/destinations/spain',
                    text: 'Spain',
                    linktype: SitecoreLinkType.External,
                }),
            },
        },
    ],
    promotionalComponent: {
        id: 'id',
        fields: {
            DataPromotion: mockSitecoreField('id'),
        },
    },
    onClick: jest.fn(),
    isUserLinkValid: jest.fn(() => true),
    getHolidayCreditLabel: jest.fn(),
    toggleIsGoBackMenuItemVisible: jest.fn(),
    wasRerendered: true,
});

const createStores = () => ({
    layoutStore: { isEditMode: false },
    holidayCreditStore: {
        isCreditBookingEnabled: true,
    },
    appStore: {
        isScreenLarge: true,
    },
    trackingStore: {
        trackNavigationClick: jest.fn(),
    },
    queryParamStore: { buildRedirectUrlQuery: jest.fn() },
    userStore: { onLogout: jest.fn() },
    routerStore: {
        redirectTo: jest.fn(),
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SubMenuItem />', () => {
    beforeEach(() => {
        mocks = createProps();
        mockStores = createStores();
    });

    it('Should standard render', () => {
        const { container } = render(<SubMenuItem {...mocks} />);

        expect(container.querySelector('.destination-menu__list')).toBeInTheDocument();
    });

    it('Should not render SubMenuItem if no links provided', () => {
        mocks.childrenLinks = undefined;

        const { container } = render(<SubMenuItem {...mocks} />);

        expect(container.querySelector('.destination-menu__list')).not.toBeInTheDocument();
    });

    it('Should render mobile version if screen is less Large', () => {
        mockStores.appStore.isScreenLarge = false;

        const { container } = render(<SubMenuItem {...mocks} />);

        expect(container.querySelector('.destination-menu__list')).toBeInTheDocument();
    });

    it('Should render data-promotion attribute if promotionalComponent has DataPromotion value', () => {
        const { container } = render(<SubMenuItem {...mocks} />);
        const elementWithAttribute = container.querySelector('.destination-menu__list-promotion-col');

        expect(elementWithAttribute).toHaveAttribute('data-promotion', 'id');
    });

    it('Should NOT render data-promotion attribute', () => {
        mocks.promotionalComponent.fields.DataPromotion = {};

        const { container } = render(<SubMenuItem {...mocks} />);
        const elementWithAttribute = container.querySelector('.destination-menu__list-promotion-col');

        expect(elementWithAttribute).not.toHaveAttribute('data-promotion');
    });

    describe('Interactions', () => {
        beforeEach(() => {
            mocks.childrenLinks = [
                {
                    id: 'id1',
                    fields: {
                        Link: mockSitecoreField({
                            text: 'Spain',
                            linktype: SitecoreLinkType.External,
                        }),
                        ChildrenLinks: [
                            {
                                id: 'child-id1',
                                fields: {
                                    Link: mockSitecoreField({
                                        href: '/destinations/spain/madrid',
                                        text: 'Madrid',
                                        linktype: SitecoreLinkType.External,
                                    }),
                                },
                            },
                        ],
                    },
                },
            ];
        });

        it('Should call trackNavigationClick when section is clicked', () => {
            render(<SubMenuItem {...mocks} />);

            fireEvent.click(screen.getByTestId('submenu-section-button'));

            expect(mockStores.trackingStore.trackNavigationClick).toHaveBeenCalled();
        });

        it('Should set active section name when mouseEnter event occurs', () => {
            render(<SubMenuItem {...mocks} />);

            fireEvent.mouseEnter(screen.getByTestId('submenu-section-button'));

            expect(screen.getByTestId('submenu-inner-links')).not.toHaveClass('destination-menu__list--hidden');
        });

        it('Should set active section name when Enter key is pressed', () => {
            render(<SubMenuItem {...mocks} />);

            fireEvent.keyDown(screen.getByTestId('submenu-section-button'), { key: 'Enter' });

            expect(screen.getByTestId('submenu-inner-links')).not.toHaveClass('destination-menu__list--hidden');
        });

        it('Should set active section name when ArrowRight key is pressed', () => {
            render(<SubMenuItem {...mocks} />);

            fireEvent.keyDown(screen.getByTestId('submenu-section-button'), { key: 'ArrowRight' });

            expect(screen.getByTestId('submenu-inner-links')).not.toHaveClass('destination-menu__list--hidden');
        });

        it('Should not prevent default or stop propagation for other keys', () => {
            render(<SubMenuItem {...mocks} />);

            const keyEvent = new KeyboardEvent('keydown', {
                key: 'ArrowLeft',
                bubbles: true,
                cancelable: true,
            });

            Object.defineProperty(keyEvent, 'preventDefault', {
                value: jest.fn(),
            });
            Object.defineProperty(keyEvent, 'stopPropagation', {
                value: jest.fn(),
            });

            screen.getByTestId('submenu-section-button').dispatchEvent(keyEvent);

            expect(keyEvent.preventDefault).not.toHaveBeenCalled();
            expect(keyEvent.stopPropagation).not.toHaveBeenCalled();
        });
    });
});

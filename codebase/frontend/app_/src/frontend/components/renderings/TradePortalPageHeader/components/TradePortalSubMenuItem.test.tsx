import React from 'react';
import { render, screen } from '@testing-library/react';

import TradePortalSubMenuItem, {
    ISubMenuItemProps,
} from 'frontend/components/renderings/TradePortalPageHeader/components/TradePortalSubMenuItem';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./TradePortalMenuPromotionalComponent', () => ({
    __esModule: true,
    default: () => <div data-tid='trade-portal-menu-promotional-component' />,
}));

const resetProps = () =>
    ({
        isOpened: true,
        parentItemName: 'parentItemName',
        childrenLinks: [
            {
                id: 'id1',
                fields: {
                    Link: {
                        value: {
                            href: '/destinations/spain',
                            text: 'Spain',
                            linktype: 'external',
                        },
                    },
                },
            },
        ],
        onClick: jest.fn(),
        isUserLinkValid: jest.fn(),
        getHolidayCreditLabel: jest.fn(),
        toggleIsGoBackMenuItemVisible: jest.fn(),
    } as ISubMenuItemProps);

const createStores = () => ({
    trackingStore: {
        trackNavigationClick: jest.fn(),
    },
    userStore: {
        isLoggedIn: true,
    },
});

let props;
let mockStores;

describe('<TradePortalSubMenuItem />', () => {
    beforeEach(() => {
        props = resetProps();
        mockStores = createStores();
    });

    it('Should standard render', () => {
        const { container } = render(<TradePortalSubMenuItem {...props} />);

        expect(container).not.toBeEmptyDOMElement();
    });

    it('Shouldn`t render TradePortalSubMenuItem if no links provided', () => {
        props.childrenLinks = undefined;
        const { container } = render(<TradePortalSubMenuItem {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render Promotional Component', () => {
        props.promotionalComponent = {
            id: 'id',
            fields: {
                Title: { value: 'title' },
                Description: { value: 'description' },
                Image: { src: 'img/src' },
                Link: {
                    value: {
                        href: '/destinations/spain',
                        text: 'Spain',
                        linktype: 'external',
                    },
                },
            },
        };

        render(<TradePortalSubMenuItem {...props} />);

        expect(screen.getByTestId('trade-portal-menu-promotional-component')).toBeInTheDocument();
    });

    it('Should render data-promotion attribute if promotionalComponent has DataPromotion value', () => {
        props.promotionalComponent = {
            id: 'id',
            fields: {
                DataPromotion: {
                    value: 'promotionExtras',
                },
                Title: { value: 'title' },
                Description: { value: 'description' },
                Image: { src: 'img/src' },
                Link: {
                    value: {
                        href: '/destinations/spain',
                        text: 'Spain',
                        linktype: 'external',
                    },
                },
            },
        };

        const { container } = render(<TradePortalSubMenuItem {...props} />);
        const elementWithAttribute = container.querySelector('.header_trade__destination-menu__list-promotion-col');

        expect(elementWithAttribute).toHaveAttribute('data-promotion', 'promotionExtras');
    });

    it('Should NOT render data-promotion attribute when DataPromotion is empty', () => {
        props.promotionalComponent = {
            id: 'id',
            fields: {
                DataPromotion: {},
                Title: { value: 'title' },
                Description: { value: 'description' },
                Image: { src: 'img/src' },
                Link: {
                    value: {
                        href: '/destinations/spain',
                        text: 'Spain',
                        linktype: 'external',
                    },
                },
            },
        };

        const { container } = render(<TradePortalSubMenuItem {...props} />);
        const elementWithAttribute = container.querySelector('.header_trade__destination-menu__list-promotion-col');

        expect(elementWithAttribute).not.toHaveAttribute('data-promotion');
    });
});

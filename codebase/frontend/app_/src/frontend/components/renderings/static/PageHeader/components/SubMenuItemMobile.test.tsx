import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import SitePath from 'models/enum/SitePath';

import SubMenuItemMobile from './SubMenuItemMobile';

jest.mock('frontend/components/common/RouterLink', () => (props: any) => (
    <a data-tid='router-link' className={props.className}>
        {props.children}
    </a>
));
jest.mock('./MenuPromotionalComponent', () => () => <div data-tid='promotion' />);

const linkField = {
    value: {
        href: 'test',
        text: 'test',
        linktype: SitecoreLinkType.Internal,
    },
};

describe('<SubMenuItemMobile/>', () => {
    const resetMocks = () =>
        ({
            childrenLinks: [],
            parentItemName: 'name',
            getHolidayCreditLabel: jest.fn(),
            isDirectLink: jest.fn(),
            toggleIsGoBackMenuItemVisible: jest.fn(),
            trackNavigationClick: jest.fn(),
            onClick: jest.fn(),
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        const { container } = render(<SubMenuItemMobile {...mocks} />);
        expect(container.querySelector('.destination-menu__list')).toBeTruthy();
    });

    it('should NOT render when childrenLinks not defined', () => {
        mocks.childrenLinks = undefined;
        const { container } = render(<SubMenuItemMobile {...mocks} />);
        expect(container.querySelector('.destination-menu__list')).toBeNull();
    });

    it('should render RouterLink with Link text value if childrenLink is direct and item is not holiday credit', () => {
        mocks.isDirectLink = jest.fn(() => true);
        mocks.childrenLinks = [
            {
                id: '',
                fields: {
                    Link: linkField,
                },
            },
        ];
        const { container } = render(<SubMenuItemMobile {...mocks} />);

        const routerLink = container.querySelector('a.destination-menu__list__item');
        expect(routerLink).toBeTruthy();
        expect(routerLink?.textContent).toBe(mocks.childrenLinks[0].fields.Link.value.text);
    });

    it('should render a tag with Link text value if childrenLink is direct and item is not holiday credit', () => {
        const creditLabel = 'credit label';
        mocks.getHolidayCreditLabel = jest.fn(() => creditLabel);
        mocks.isDirectLink = jest.fn(() => false);
        mocks.childrenLinks = [
            {
                id: '',
                fields: {
                    Link: { value: { ...linkField, href: SitePath.HolidayCredit } },
                },
            },
        ];
        const { container } = render(<SubMenuItemMobile {...mocks} />);

        const directTag = container.querySelector('a.destination-menu__list__item');
        expect(directTag).toBeTruthy();
        expect(directTag?.textContent).toContain(creditLabel);
    });

    it('should render childrenLinks when they are defined', () => {
        mocks.childrenLinks = [
            {
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
                        {
                            id: '',
                            fields: {
                                Link: linkField,
                            },
                        },
                    ],
                },
            },
        ];
        const { container } = render(<SubMenuItemMobile {...mocks} />);

        const items = container.querySelectorAll('.destination-menu__list__item');
        expect(container.querySelector('.destination-menu__list')).toBeTruthy();
        expect(container.querySelectorAll('.go-back')).toHaveLength(mocks.childrenLinks.length);
        expect(items).toHaveLength(mocks.childrenLinks.length + mocks.childrenLinks[0].fields.ChildrenLinks.length);
    });

    it('should render MenuPromotionalComponent when promotionalComponent defined', () => {
        mocks.promotionalComponent = {
            fields: {},
            id: '',
        };
        const { container } = render(<SubMenuItemMobile {...mocks} />);
        expect(container.querySelector('.destination-menu__list-promotion-col')).toBeTruthy();
        expect(screen.getByTestId('promotion')).toBeInTheDocument();
    });

    it('should render data-promotion attribute if promotionalComponent has DataPromotion value', () => {
        mocks.promotionalComponent = {
            fields: {
                DataPromotion: {
                    value: 'promotionDeals',
                },
            },
            id: '',
        };
        const { container } = render(<SubMenuItemMobile {...mocks} />);
        const elementWithAttribute = container.querySelector('.destination-menu__list-promotion-col');

        expect(elementWithAttribute).toHaveAttribute('data-promotion', 'promotionDeals');
    });

    it('should NOT render data-promotion attribute when DataPromotion is empty', () => {
        mocks.promotionalComponent = {
            fields: {
                DataPromotion: {},
            },
            id: '',
        };
        const { container } = render(<SubMenuItemMobile {...mocks} />);
        const elementWithAttribute = container.querySelector('.destination-menu__list-promotion-col');

        expect(elementWithAttribute).not.toHaveAttribute('data-promotion');
    });
});

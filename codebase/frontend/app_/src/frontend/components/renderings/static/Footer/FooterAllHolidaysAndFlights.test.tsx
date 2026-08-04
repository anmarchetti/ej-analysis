import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Anchor } from 'code/anchors';
import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { scrollToOfferConditions } from 'frontend/utils/ui.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import FooterLinks, { TFooterLinkProps } from './FooterAllHolidaysAndFlights';

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToOfferConditions: jest.fn(),
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockRouterLinkProps(props);

        return <div data-tid='router-link'>{children}</div>;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='text' />;
    },
}));

const mockAccordionButtonProps = jest.fn();
jest.mock('frontend/components/common/AccordionButton', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockAccordionButtonProps(props);

        return <div data-tid='accordion-button' onClick={onClick} />;
    },
}));

const createRouter = () => ({
    query: {},
    pathname: '/',
    asPath: '/',
    events: {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    },
    push: jest.fn(() => Promise.resolve(true)),
    prefetch: jest.fn(() => Promise.resolve(true)),
    replace: jest.fn(() => Promise.resolve(true)),
});

jest.mock('next/router', () => ({
    useRouter: () => mockRouter,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockRouter;
let mockProps;
let mockStores;

describe('<FooterLinks />', () => {
    const resetMocks = (): TFooterLinkProps => ({
        fields: {
            DesktopTitle: mockSitecoreField('DesktopTitle'),
            MobileTitle: mockSitecoreField('MobileTitle'),
            ListOfTitles: [
                {
                    id: 'titleId',
                    fields: {
                        ListOfSubtitles: [
                            {
                                fields: {
                                    Subtitle: mockSitecoreField('subtitle'),
                                    SubtitleLink: mockSitecoreField(
                                        mockSitecoreLinkField('href', '', SitecoreLinkType.Internal),
                                    ),
                                },
                                id: 'subtitleId',
                            },
                        ],
                        Title: mockSitecoreField('title'),
                    },
                },
            ],
        },
        params: { isItOnlyOnDesktopVisible: undefined },
        rendering: {},
        wasRerendered: true,
    });

    beforeEach(() => {
        jest.resetAllMocks();
        mockRouter = createRouter();
        mockProps = resetMocks();
        mockStores = createMockStores();
    });

    it('should not render when fields are empty', () => {
        mockProps.fields = null;
        const { container } = render(<FooterLinks {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard', () => {
        render(<FooterLinks {...mockProps} />);
        const firstListOfTitlesItemMock = mockProps.fields.ListOfTitles[0];
        const firstListOfSubtitlesItemMock = firstListOfTitlesItemMock.fields.ListOfSubtitles[0];
        const rendering = screen.getByTestId('footer-links');
        const renderingWrapper = rendering.querySelector('.wrapper-container.wrapper-container--px');
        const renderingWrapperRow = renderingWrapper!.querySelector('.footer__row.row');
        const columns = renderingWrapperRow!.querySelectorAll('.col-auto');
        const footerLinksBlock = renderingWrapper!.querySelector(`[id="${firstListOfTitlesItemMock.id}"]`);
        const footerLinksWrapper = footerLinksBlock!.querySelector('.footer-links__wrapper');
        const footerLinksWrapperRow = footerLinksWrapper!.querySelector('.row.mx-0.mt-2.mt-lg-3');

        expect(rendering).toHaveClass('footer-links footer--grey');
        expect(columns[0].childElementCount).toBe(1);
        expect(columns[0]!.querySelector('[data-tid="text"]')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenNthCalledWith(1, {
            tag: 'p',
            className: 'footer-links__title d-none d-md-block',
            'data-tid': 'footer-holidays-title-desktop',
            field: mockProps.fields.DesktopTitle,
        });
        expect(columns[1].childElementCount).toBe(1);
        expect(columns[1]!.querySelector('[data-tid="accordion-button"]')).toBeInTheDocument();
        expect(mockAccordionButtonProps).toHaveBeenNthCalledWith(1, {
            panelId: firstListOfTitlesItemMock.id,
            buttonContent: firstListOfTitlesItemMock.fields.Title.value,
            isExpanded: false,
            dataTid: 'footer-holidays-subtitle-desktop',
            className: 'footer-links__toggle-btn d-none d-md-inline-block',
        });
        expect(footerLinksBlock).toHaveClass('d-none');
        expect(footerLinksWrapper!.querySelector('[data-tid="text"]')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenNthCalledWith(2, {
            tag: 'p',
            className: 'footer-links__subtitle',
            'data-tid': 'footer-holidays-subtitle',
            field: firstListOfTitlesItemMock.fields.Title,
        });
        expect(footerLinksWrapperRow!.querySelector('[data-tid="router-link"]')).toHaveTextContent(
            firstListOfSubtitlesItemMock.fields.Subtitle.value,
        );
        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            link: firstListOfSubtitlesItemMock.fields.SubtitleLink,
            dataId: 'footer-holidays-link',
        });
    });

    it('should call scrollToOfferConditions after click on accordion button', async () => {
        render(<FooterLinks {...mockProps} />);
        const accordionButton = screen.getByTestId('accordion-button');

        fireEvent.click(accordionButton);

        await waitFor(() => {
            expect(scrollToOfferConditions).toHaveBeenCalledWith(Anchor.FooterLinks);
        });
    });

    it('should render accordion button inside first col when wasRerendered is truthy and both isScreenMedium & isItOnlyOnDesktopVisible params are falsy', async () => {
        mockStores.appStore.isScreenMedium = false;
        const { container } = render(<FooterLinks {...mockProps} />);
        const columns = container.querySelectorAll('.col-auto');

        expect(columns[0].childElementCount).toBe(2);
        expect(columns[0]!.querySelector('[data-tid="accordion-button"]')).toBeInTheDocument();
        expect(mockAccordionButtonProps).toHaveBeenNthCalledWith(1, {
            buttonContent: mockProps.fields.MobileTitle.value,
            isExpanded: false,
            dataTid: 'footer-holidays-title-mobile',
            className: 'footer-links__toggle-btn',
        });
    });
});

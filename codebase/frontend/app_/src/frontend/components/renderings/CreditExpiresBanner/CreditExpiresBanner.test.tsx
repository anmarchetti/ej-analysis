import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { mockBalanceHistoryItem } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistory.mocks';

import { mockCreditExpiresBannerFields } from './mocks/creditExpiresBannerFields.mock';
import * as utils from './utils/utils';
import CreditExpiresBanner, { ICreditExpiresBannerProps } from './CreditExpiresBanner';

const mockExpandableItem = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: props => {
        mockExpandableItem(props);

        return <div data-tid={props.dataTid}>{props.children}</div>;
    },
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockLink = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: props => {
        mockLink(props);

        return <div data-tid='link' />;
    },
}));

const mockSitecoreText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockSitecoreText(props);

        return <div data-tid='sitecore-text' />;
    },
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const createProps = (): ICreditExpiresBannerProps => ({
    fields: mockCreditExpiresBannerFields,
    params: {},
    rendering: {},
});

const createStores = () =>
    createMockStores({
        marketStore: {
            currency: 'GBP',
        },
        layoutStore: {
            isHolidayCreditPage: false,
        },
        holidayCreditStore: {
            balanceHistory: mockBalanceHistoryItem,
            fetchBalanceHistory: jest.fn(),
            clearStore: jest.fn(),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockGetSitecoreContent = mockCreditExpiresBannerFields.Children[0].fields;
jest.mock('./utils/utils', () => ({
    getSitecoreContent: jest.fn(() => mockGetSitecoreContent),
}));
const spyOnGetSitecoreContent = jest.spyOn(utils, 'getSitecoreContent');

describe('<CreditExpiresBanner />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should NOT render component when no fields and NOT call getSitecoreContent', () => {
        delete mockProps.fields;

        const { container } = render(<CreditExpiresBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(spyOnGetSitecoreContent).not.toHaveBeenCalled();
    });

    it('should NOT render component when no balance history', () => {
        mockStores.holidayCreditStore.balanceHistory = null;

        const { container } = render(<CreditExpiresBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(spyOnGetSitecoreContent).not.toHaveBeenCalled();
    });

    it('should NOT render component when getSitecoreContent returns undefined', () => {
        spyOnGetSitecoreContent.mockReturnValueOnce(undefined);

        const { container } = render(<CreditExpiresBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(spyOnGetSitecoreContent).toHaveBeenCalled();
    });

    it('should render component for desktop', () => {
        const { unmount } = render(<CreditExpiresBanner {...mockProps} />);

        expect(screen.getByTestId('credit-expires-banner')).toHaveClass('creditBanner');

        expect(mockJSSImage).toHaveBeenCalledWith({
            field: mockProps.fields?.Icon,
            className: 'icon',
            'data-tid': 'banner-icon',
        });
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();

        expect(mockSitecoreText).toHaveBeenCalledWith({
            field: mockGetSitecoreContent.Title,
            className: 'title',
            'data-tid': 'banner-title',
            tag: 'h3',
        });
        expect(screen.getByTestId('sitecore-text')).toBeInTheDocument();

        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: mockGetSitecoreContent.Subtitle,
            className: 'text',
            dataId: 'banner-text',
        });
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();

        expect(mockLink).toHaveBeenCalledWith({
            className: 'cta',
            href: mockProps.fields?.BookHolidayCTA.value?.href,
            target: mockProps.fields?.BookHolidayCTA.value?.target,
            'data-tid': 'book-holiday-cta',
            children: mockProps.fields?.BookHolidayCTA.value?.text,
        });
        expect(screen.getByTestId('link')).toBeInTheDocument();

        expect(mockStores.holidayCreditStore.fetchBalanceHistory).toHaveBeenCalled();
        expect(spyOnGetSitecoreContent).toHaveBeenCalled();

        unmount();

        expect(mockStores.holidayCreditStore.clearStore).toHaveBeenCalled();
    });

    it('should render component for mobile', () => {
        mockUseMobileViewport = true;

        const { unmount } = render(<CreditExpiresBanner {...mockProps} />);

        expect(screen.getByTestId('credit-expires-banner')).toHaveClass('creditBanner');

        expect(mockExpandableItem).toHaveBeenCalledWith({
            dataTid: 'expandable-banner',
            className: 'expandable',
            titleWrapperClassName: 'titleWrapper',
            title: mockGetSitecoreContent.Title.value,
            titleClassName: 'title',
            icon: expect.anything(),
            children: expect.anything(),
            expandArrowClassName: 'expandArrow',
        });
        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();

        expect(mockStores.holidayCreditStore.fetchBalanceHistory).toHaveBeenCalled();
        expect(spyOnGetSitecoreContent).toHaveBeenCalled();

        unmount();

        expect(mockStores.holidayCreditStore.clearStore).toHaveBeenCalled();
    });

    it('should NOT render button if BookHolidayCTA field is missing', () => {
        mockProps.fields = {
            BookHolidayCTA: {
                value: { href: '', text: '', target: '', linktype: SitecoreLinkType.Internal },
            },
            Children: mockProps.fields!.Children || [],
            Icon: mockProps.fields!.Icon,
        };

        render(<CreditExpiresBanner {...mockProps} />);
        expect(screen.queryByTestId('link')).not.toBeInTheDocument();
    });

    it('should NOT call fetchBalanceHistory and clearStore when isHolidayCreditPage is true', () => {
        mockStores.layoutStore.isHolidayCreditPage = true;

        const { unmount } = render(<CreditExpiresBanner {...mockProps} />);

        expect(mockStores.holidayCreditStore.fetchBalanceHistory).not.toHaveBeenCalled();
        unmount();
        expect(mockStores.holidayCreditStore.clearStore).not.toHaveBeenCalled();
    });
});

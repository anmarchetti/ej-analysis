import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { PromoBlocksMaxItems, PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { promoBlockItemsMocks } from 'frontend/components/renderings/PromoBlocks/__mocks__/promoBlocksItems';
import { promoBlockParamsMocks } from 'frontend/components/renderings/PromoBlocks/__mocks__/promoBlocksParams';
import { PROMO_BLOCK_GROUP_THEMES } from 'frontend/components/renderings/PromoBlocks/PromoBlocks.utils';

import PromoBlocksRenderHelper, { IPromoBlocksRenderHelperProps } from './PromoBlocksRenderHelper';

jest.mock('frontend/utils/sitecore.utils', () => ({
    isSitecoreCheckboxSelected: jest.fn(value => value === '1'),
}));

const mockSplitToChunksArray = jest.fn();
jest.mock('frontend/utils/chunkArray', () => ({
    ...jest.requireActual('frontend/utils/chunkArray'),
    splitToChunksArray: (...args) => mockSplitToChunksArray(...args),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

const mockPromoBlocksCarouselProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/PromoBlocksCarousel/PromoBlocksCarousel', () => ({
    __esModule: true,
    default: props => {
        mockPromoBlocksCarouselProps(props);

        return <div data-tid='promo-blocks-carousel' />;
    },
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

const mockPromoBlockGroupProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/PromoBlocksGroup/PromoBlocksGroup', () => ({
    __esModule: true,
    PromoBlocksGroup: props => {
        mockPromoBlockGroupProps(props);

        return <div data-tid='promo-block-group' />;
    },
}));

const mockPromoBlockSingleItemProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/PromoBlocksSingleItem', () => ({
    __esModule: true,
    PromoBlocksSingleItem: props => {
        mockPromoBlockSingleItemProps(props);

        return <button data-tid='single-item' onClick={props.onClick} />;
    },
}));

jest.mock(
    'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper',
    () => ({
        __esModule: true,
        default: ({ children }) => <div data-tid='promo-blocks-tracking-wrapper'>{children}</div>,
    }),
);

const mockUseXSMobileViewport = jest.fn();
const mockUseMoreThenTabletViewport = jest.fn();
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockUseXSMobileViewport(),
    useMoreThenTabletViewport: () => mockUseMoreThenTabletViewport(),
}));

let mockStore;
let mockProps: IPromoBlocksRenderHelperProps;

const createProps = (): IPromoBlocksRenderHelperProps => ({
    items: promoBlockItemsMocks,
    Link: mockSitecoreField(mockSitecoreLinkField('/test-url', 'Test Link')),
    params: { ...promoBlockParamsMocks },
    displayNumberOfNights: true,
    handleClickItem: jest.fn(),
    isTouristTaxTooltipShown: true,
    uid: 'uid',
    shouldTrackAsPromoBlocks: true,
});

describe('PromoBlocksRenderHelper', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStore = createMockStores({
            layoutStore: {
                isTouristTaxEnabled: true,
            },
        });

        mockUseXSMobileViewport.mockReturnValue(false);
        mockUseMoreThenTabletViewport.mockReturnValue(true);
    });

    it('should render PromoBlockGroup with tracking wrapper if theme is in the list of PROMO_BLOCK_GROUP_THEMES', () => {
        mockProps.params.Theme = PROMO_BLOCK_GROUP_THEMES[0];

        render(<PromoBlocksRenderHelper {...mockProps} />);

        expect(screen.getByTestId('promo-block-group')).toBeInTheDocument();
        expect(screen.getByTestId('promo-blocks-tracking-wrapper')).toBeInTheDocument();
        expect(mockPromoBlockGroupProps).toHaveBeenCalledWith({
            items: mockProps.items,
            Link: mockProps.Link,
            handleClickItem: mockProps.handleClickItem,
            displayNumberOfNights: true,
            isMultiRow: false,
            titleClassName: 'font-rounded textSmall textWhite',
            params: mockProps.params,
        });
    });

    it('should do a regular render with Single Items, carousel and tracking wrapper', () => {
        mockProps.params.IsMultiRow = undefined;

        render(<PromoBlocksRenderHelper {...mockProps} />);

        expect(screen.getByTestId('promo-blocks-tracking-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('promo-blocks-carousel')).toBeInTheDocument();
        expect(screen.getAllByTestId('single-item')).toHaveLength(2);

        expect(mockPromoBlocksCarouselProps).toHaveBeenCalledWith({
            blockFields: mockProps.items,
            handleClickItem: mockProps.handleClickItem,
            shouldShowShard: true,
            theme: PromoBlocksThemes.Big,
            withDarkOverlay: true,
            pillAlignment: mockProps.params.PillAlignment,
            titlePlacement: mockProps.params.TitlePlacement,
            titleClassName: 'font-rounded textSmall textWhite',
        });

        expect(mockPromoBlockSingleItemProps).toHaveBeenCalledWith({
            className: 'bigBlockItem',
            fields: mockProps.items[0],
            onClick: expect.any(Function),
            shouldShowShard: true,
            withDarkOverlay: true,
            theme: PromoBlocksThemes.Big,
            pillAlignment: mockProps.params.PillAlignment,
            titlePlacement: mockProps.params.TitlePlacement,
            titleClassName: 'font-rounded textSmall textWhite',
        });
        expect(mockPromoBlockSingleItemProps).toHaveBeenCalledWith({
            className: 'bigBlockItem',
            fields: mockProps.items[1],
            onClick: expect.any(Function),
            shouldShowShard: true,
            withDarkOverlay: true,
            theme: PromoBlocksThemes.Big,
            pillAlignment: mockProps.params.PillAlignment,
            titlePlacement: mockProps.params.TitlePlacement,
            titleClassName: 'font-rounded textSmall textWhite',
        });
    });

    it('should render carousel with Small promo block', () => {
        mockProps.params.IsMultiRow = undefined;
        mockProps.items = [...mockProps.items, ...mockProps.items];
        mockProps.params.Theme = PromoBlocksThemes.Small;

        mockUseXSMobileViewport.mockReturnValueOnce(true);

        render(<PromoBlocksRenderHelper {...mockProps} />);

        expect(mockSplitToChunksArray).toHaveBeenCalledWith(mockProps.items, PromoBlocksMaxItems.MobileView);
    });

    it('should NOT render carousel when IsMultiRow is 1', () => {
        mockProps.params.IsMultiRow = '1';

        render(<PromoBlocksRenderHelper {...mockProps} />);

        expect(screen.queryByTestId('promo-blocks-carousel')).not.toBeInTheDocument();
    });

    it('should render wrapper with hide class when items.length > maxItems', () => {
        mockProps.items = [...mockProps.items, ...mockProps.items];

        const { container } = render(<PromoBlocksRenderHelper {...mockProps} />);

        expect(container.querySelector('.hide')).toBeInTheDocument();
    });

    it('should handle click on promo item', async () => {
        render(<PromoBlocksRenderHelper {...mockProps} />);

        await userEvent.click(screen.getAllByTestId('single-item')[0]);

        expect(mockProps.handleClickItem).toHaveBeenCalled();
    });

    describe('Tourist Tax Tooltip', () => {
        it('should render tax info for Big variant when isTouristTaxEnabled and isTouristTaxTooltipShown are true', () => {
            render(<PromoBlocksRenderHelper {...mockProps} />);

            expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
        });

        it('should NOT render tax info for Big variant when isTouristTaxEnabled is false', () => {
            mockStore.layoutStore.isTouristTaxEnabled = false;
            render(<PromoBlocksRenderHelper {...mockProps} />);

            expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        });

        it('should NOT render tax info for Big variant when isTouristTaxTooltipShown is false', () => {
            mockProps.isTouristTaxTooltipShown = false;
            render(<PromoBlocksRenderHelper {...mockProps} />);

            expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        });

        it('should NOT render tax info when variant is not Big and isLivePriceEnabled is false', () => {
            mockProps.params.Theme = PromoBlocksThemes.FeaturedFacilities;
            render(<PromoBlocksRenderHelper {...mockProps} />);

            expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        });
    });

    it('should render PromoBlockGroup with empty titleClassName when TitleFontSize and TitleFontStyle are not defined in sitecore', () => {
        mockProps.params.Theme = PROMO_BLOCK_GROUP_THEMES[0];
        mockProps.params.TitleFontSize = undefined;
        mockProps.params.TitleFontStyle = undefined;
        mockProps.params.TitleColor = undefined;

        render(<PromoBlocksRenderHelper {...mockProps} />);

        expect(screen.getByTestId('promo-block-group')).toBeInTheDocument();
        expect(mockPromoBlockGroupProps).toHaveBeenCalledWith({
            items: mockProps.items,
            Link: mockProps.Link,
            handleClickItem: mockProps.handleClickItem,
            displayNumberOfNights: true,
            isMultiRow: false,
            titleClassName: '',
            params: mockProps.params,
        });
    });
});

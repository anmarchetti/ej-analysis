import React from 'react';
import { render, screen } from '@testing-library/react';

import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { BigVariantPillAlignment, BigVariantTitlePlacementOptions } from 'models/enum/PromoBlocksBigVariantParams';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';

import { IPromoBlocksCarouselItemsProps, PromoBlocksCarouselItems } from './PromoBlocksCarouselItems';

const mockPromoBlocksSingleItemProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/PromoBlocksSingleItem', () => ({
    __esModule: true,
    PromoBlocksSingleItem: props => {
        mockPromoBlocksSingleItemProps(props);

        return <div data-tid='single-item' />;
    },
}));

const buildItems = (length?: number): IPromoBlockFields | IPromoBlockFields[] => {
    if (!length)
        return {
            fields: {},
            id: 'id',
            isLivePriceValid: true,
            livePrice: null,
        } as IPromoBlockFields;

    return new Array(length).fill(0).map((_, i) => ({
        fields: {},
        id: i + 'id',
        isLivePriceValid: true,
        livePrice: null,
    })) as IPromoBlockFields[];
};

const resetProps = (): IPromoBlocksCarouselItemsProps => ({
    baseIndex: 0,
    handleClickItem: jest.fn(),
    items: buildItems(),
    shouldShowShard: true,
    theme: PromoBlocksThemes.Big,
    pillAlignment: BigVariantPillAlignment.Left,
    titlePlacement: BigVariantTitlePlacementOptions.TitleBelowImage,
    withDarkOverlay: true,
    titleClassName: 'titleClassName',
});

let mockProps: IPromoBlocksCarouselItemsProps;

describe('<PromoBlocksCarouselItems />', () => {
    beforeEach(() => {
        mockProps = resetProps();
    });

    it('should render component with nested items as array', () => {
        mockProps.items = buildItems(3);
        render(<PromoBlocksCarouselItems {...mockProps} />);

        expect(screen.getAllByTestId('single-item')).toHaveLength(3);
        expect(mockPromoBlocksSingleItemProps).toHaveBeenCalledWith({
            fields: { fields: {}, id: '0id', isLivePriceValid: true, livePrice: null },
            onClick: expect.any(Function),
            theme: PromoBlocksThemes.Big,
            shouldShowShard: true,
            withDarkOverlay: true,
            pillAlignment: 'Left',
            titlePlacement: 'Title Below Image',
            titleClassName: 'titleClassName',
            className: 'item',
        });
    });

    it('should render component with nested items as NON array', () => {
        render(<PromoBlocksCarouselItems {...mockProps} />);

        expect(screen.getAllByTestId('single-item')).toHaveLength(1);
        expect(mockPromoBlocksSingleItemProps).toHaveBeenCalledWith({
            fields: { fields: {}, id: 'id', isLivePriceValid: true, livePrice: null },
            onClick: expect.any(Function),
            theme: PromoBlocksThemes.Big,
            shouldShowShard: true,
            withDarkOverlay: true,
            pillAlignment: 'Left',
            titlePlacement: 'Title Below Image',
            titleClassName: 'titleClassName',
            className: 'item',
        });
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { getMockedPromoBlockItem } from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/__mocks__/promoBlockItem';

import { MosaicBlocksItem } from './MosaicBlocksItem';

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: () => <div data-tid='jss-image' />,
}));

const mockPriceLabelComponent = jest.fn();
jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: ({ dataTid, price, ...props }) => {
        mockPriceLabelComponent(props);

        return <div data-tid={dataTid}>{price}</div>;
    },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ link, onClick }) => (
        <a href={link.value.href} onClick={onClick} data-tid='router-link'>
            {link.value.text}
        </a>
    ),
}));

const resetMocks = () => ({
    item: { ...getMockedPromoBlockItem(), isLivePriceValid: true },
    displayNumberOfNights: true,
    onClick: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: { isTouristTaxEnabled: true },
        appStore: { isScreenLessMedium: false },
        marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    });

let mockStores;
let mocks;

const mockTrackItemClick = jest.fn();
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ trackItemClick: mockTrackItemClick }),
}));

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: (callback: any) => callback(mockStores),
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

const mockFormatMoneyWithTouristTax = jest.fn();
jest.mock('frontend/utils/touristTax.utils', () => ({
    __esModule: true,
    formatMoneyWithTouristTax: (...params) => mockFormatMoneyWithTouristTax(...params),
}));

describe('<MosaicBlocksItem />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
        mockFormatMoneyWithTouristTax.mockReturnValue('£110');
    });

    it('should standard render', () => {
        render(<MosaicBlocksItem {...mocks} />);

        expect(screen.getByText(mocks.item.fields.Title.value)).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', mocks.item.fields.Link.value.href);
        expect(screen.queryByTestId('item-price')).not.toBeInTheDocument();

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mocks.item.fields.Image,
                fill: true,
                mediaSize: { desktop: MediaSize.Big },
            }),
        );
    });

    it('should render isEditMode', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<MosaicBlocksItem {...mocks} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(screen.getByText(mocks.item.fields.Title.value)).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', mocks.item.fields.Link.value.href);
        expect(screen.queryByTestId('item-price')).not.toBeInTheDocument();
    });

    it('should render without title', () => {
        mocks.item.fields.Title.value = '';
        render(<MosaicBlocksItem {...mocks} />);

        expect(screen.queryByTestId('item-title')).not.toBeInTheDocument();
    });

    it('should render with price', () => {
        mocks.item.livePrice = {
            pricePP: 100,
            pricePPExcludingTouristTax: 90,
            searchCriteria: { duration: 7 },
            touristTaxPP: 10,
        };
        render(<MosaicBlocksItem {...mocks} />);

        expect(screen.getByTestId('item-price')).toBeInTheDocument();
        expect(screen.getByText('£110')).toBeInTheDocument();
        expect(mockPriceLabelComponent).toHaveBeenCalledWith({
            className: 'price',
            numberOfNights: 7,
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
            tag: 'div',
            wrapLabelAfterPrice: expect.any(Function),
            wrapLabelBeforePrice: expect.any(Function),
            wrapPrice: expect.any(Function),
        });
        expect(mockFormatMoneyWithTouristTax).toHaveBeenCalledWith(100, 90, true, mockStores.marketStore.formatMoney, {
            currency: mocks.item.livePrice.currency,
            maximumFractionDigits: 0,
        });
    });

    it('should render price label without number of nights when displayNumberOfNights is false', () => {
        mocks.item.livePrice = {
            pricePP: 100,
            pricePPExcludingTouristTax: 90,
            searchCriteria: { duration: 7 },
            touristTaxPP: 10,
        };
        mocks.displayNumberOfNights = false;
        render(<MosaicBlocksItem {...mocks} />);

        expect(mockPriceLabelComponent).toHaveBeenCalledWith({
            className: 'price',
            numberOfNights: 0,
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
            tag: 'div',
            wrapLabelAfterPrice: expect.any(Function),
            wrapLabelBeforePrice: expect.any(Function),
            wrapPrice: expect.any(Function),
        });
    });

    it('should call trackItemClick with correct item when link is clicked', async () => {
        render(<MosaicBlocksItem {...mocks} />);

        await userEvent.click(screen.getByTestId('router-link'));

        expect(mockTrackItemClick).toHaveBeenNthCalledWith(1, mocks.item);
    });
});

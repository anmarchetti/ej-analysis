import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { isTradeStore } from 'frontend/store/tradePortal';
import { IBoardType } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AltBoardItem, { IAltBoardItemProps } from './AltBoardItem';

jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({ price }) => <div>{price}</div>);

jest.mock('frontend/components/common/BlockSelected', () => ({
    __esModule: true,
    default: ({ siteCoreKey }) => <div data-tid='block-selected'>{siteCoreKey}</div>,
}));

const mockFreeBoardUpgradePill = jest.fn();
jest.mock('frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill', () => ({
    __esModule: true,
    default: props => {
        mockFreeBoardUpgradePill(props);

        return <div data-tid='free-board-upgrade-pill' />;
    },
}));

const mockDiscountedBoardPercentagePillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPercentagePill', () => ({
    __esModule: true,
    default: props => {
        mockDiscountedBoardPercentagePillComponent(props);

        return <div data-tid='discounted-board-percentage-pill' />;
    },
}));

jest.mock('frontend/store/tradePortal', () => ({
    ...jest.requireActual('frontend/store/tradePortal'),
    isTradeStore: jest.fn(),
}));

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isPricesHidden: false,
    },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

const createProps = () =>
    ({
        selectedBoardPricePP: 100,
        board: {
            title: 'boardTitle',
            code: 'boardCode',
            content: 'boardContent',
        } as IBoardType,
        isSelected: true,
        isPricePPShown: true,
        currency: undefined,
        onSelect: jest.fn(),
    } as IAltBoardItemProps);

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AltBoardItem />', () => {
    beforeEach(() => {
        (isTradeStore as any).mockReturnValue(true);
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should standard render', () => {
        const { container } = render(<AltBoardItem {...mockProps} />);

        expect(screen.getByTestId('alt-board-item-wrapper').classList.contains('item itemSelected')).toBeFalsy();
        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(mockProps.board.title);
        expect(container.querySelector('.itemInfo')).toContainElement(container.querySelector('.description'));
        expect(container.querySelector('.description')).toHaveTextContent(mockProps.board.content);
        expect(container.querySelector('.itemButtons')).toContainElement(screen.getByTestId('block-selected'));
        expect(screen.getByTestId('block-selected')).toHaveTextContent(SitecoreDictionary.BoardTypesButtonsSelected);
        expect(container.querySelector('.selectedLabel')).toHaveTextContent(
            SitecoreDictionary.BoardTypesLabelsIncludedInHoliday,
        );
        expect(screen.getAllByTestId('free-board-upgrade-pill')).toHaveLength(2);

        expect(mockFreeBoardUpgradePill).toHaveBeenNthCalledWith(1, {
            isFreeBoardUpgrade: false,
            tooltipClass: 'tooltip priority',
        });
        expect(mockFreeBoardUpgradePill).toHaveBeenNthCalledWith(2, {
            isFreeBoardUpgrade: false,
            tooltipClass: 'tooltip priority',
        });
    });

    it('should render non-selected component state when isSelected prop is false', () => {
        mockProps.isSelected = false;
        mockStores.marketStore.formatMoney.mockReturnValueOnce('-£100');
        const { container } = render(<AltBoardItem {...mockProps} />);

        expect(container.querySelector('.selectedLabel')).not.toBeInTheDocument();
        expect(screen.getByTestId('alt-board-item-wrapper').classList.contains('itemSelected')).toBeFalsy();
        expect(screen.getByRole('button')).toHaveTextContent(`-£${mockProps.selectedBoardPricePP}`);
        expect(screen.getByRole('button').classList.contains('itemAction')).toBeTruthy();
        expect(screen.getByRole('button').classList.contains('btn--full-width')).toBeTruthy();
    });

    it('should NOT render item info block and selected label when board content is not defined', () => {
        mockProps.board.content = undefined;
        const { container } = render(<AltBoardItem {...mockProps} />);

        expect(container.querySelector('.itemInfo')).not.toBeInTheDocument();
        expect(container.querySelector('.selectedLabel')).not.toBeInTheDocument();
    });

    it('should NOT render text without price on button when isSelected prop is false and isPricesHidden is true', () => {
        mockProps.isSelected = false;
        mockStores.layoutStore.isPricesHidden = true;

        render(<AltBoardItem {...mockProps} />);

        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.BoardTypesLabelsSelect);
    });

    it('should call onSelect prop func when click on button', () => {
        mockProps.isSelected = false;
        mockStores.layoutStore.isPricesHidden = true;
        render(<AltBoardItem {...mockProps} />);

        fireEvent.click(screen.getByRole('button', { name: SitecoreDictionary.BoardTypesLabelsSelect }));

        expect(mockProps.onSelect).toHaveBeenCalled();
    });

    it('should render code in board details section when board title is not defined', () => {
        mockProps.board.title = '';
        render(<AltBoardItem {...mockProps} />);

        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(mockProps.board.code);
    });

    it('should NOT render board details heading when both board title and code are not defined', () => {
        mockProps.board.title = '';
        mockProps.board.code = '';
        render(<AltBoardItem {...mockProps} />);

        expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
    });

    it('should render no postfix when isPricePPShown is false', () => {
        mockProps.isSelected = false;
        mockProps.isPricePPShown = false;
        mockStores.marketStore.formatMoney.mockReturnValueOnce('-£100');

        render(<AltBoardItem {...mockProps} />);

        expect(screen.getByRole('button')).toHaveTextContent(`-£${mockProps.selectedBoardPricePP}`);
    });

    it('should render free-board-upgrade pill', () => {
        mockProps.board = {
            title: 'boardTitle',
            code: 'boardCode',
            content: 'boardContent',
            isFreeBoardUpgrade: true,
        } as IBoardType;

        render(<AltBoardItem {...mockProps} />);

        expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
            isFreeBoardUpgrade: true,
            tooltipClass: 'tooltip priority',
        });
        expect(mockDiscountedBoardPercentagePillComponent).toHaveBeenCalledWith({
            percent: undefined,
        });
    });

    it('should render discounted-board-percentage-pill when discountPercent is provided', () => {
        mockProps.board = {
            title: 'boardTitle',
            code: 'boardCode',
            content: 'boardContent',
            isFreeBoardUpgrade: false,
            discountPercent: 20,
        } as IBoardType;

        render(<AltBoardItem {...mockProps} />);

        expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
            isFreeBoardUpgrade: false,
            tooltipClass: 'tooltip priority',
        });
        expect(mockDiscountedBoardPercentagePillComponent).toHaveBeenCalledWith({
            percent: 20,
        });
    });
});

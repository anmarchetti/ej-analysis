import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { TrailingZeroDisplay } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockMonthItem } from 'frontend/__mocks__/monthsAvailability';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import MonthOption, { IMonthOptionProps } from './MonthOption';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockProps;
let mockStores;

const createMockProps = (): IMonthOptionProps => ({
    isVisible: true,
    month: { ...mockMonthItem },
    onMonthChange: jest.fn(),
});

const mockUseSearchPodStore = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    __esModule: true,
    useSearchPodStore: () => mockUseSearchPodStore(),
}));

const mockReplaceToken = jest.fn();
jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

const mockJSSImageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageNextProps(props);

        return <div data-tid='jss-image' />;
    },
}));

jest.mock('./MonthOptionOld/MonthOptionOld', () => ({
    __esModule: true,
    default: () => <div data-tid='option-old' />,
}));

describe('MonthOption', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            searchStore: {
                searchWhen: {
                    from: null,
                },
            },
            layoutStore: {
                isCheapestMonthPriceEnabled: true,
                shouldShowCheapestMonthTotalPrice: true,
            },
        });

        mockReplaceToken.mockReturnValue('Price $100');

        mockUseSearchPodStore.mockReturnValue({
            fields: {
                CheapestMonthLabel: mockSitecoreField('CheapestMonthLabel'),
                CheapestMonthUnavailableLabel: mockSitecoreField('CheapestMonthUnavailableLabel'),
                CheapestMonthIcon: mockSitecoreField(mockSitecoreImageField('CheapestMonthIcon')),
            },
        });
    });

    it('should render month label and input', () => {
        render(<MonthOption {...mockProps} />);

        expect(screen.getByTestId('month-option')).toBeInTheDocument();
        expect(screen.getByTestId('July-2025-label')).toBeInTheDocument();
        expect(screen.getByTestId('July-2025-input')).toBeInTheDocument();
    });

    it('should render disabled month if availability is false', () => {
        mockProps.month.availability = false;
        render(<MonthOption {...mockProps} />);

        const input = screen.getByTestId('July-2025-input');

        expect(input).toHaveProperty('disabled', true);
        expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render disabled month if availability is undefined', () => {
        mockProps.month.availability = undefined;
        render(<MonthOption {...mockProps} />);

        const input = screen.getByTestId('July-2025-input');

        expect(input).toHaveProperty('disabled', true);
        expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render selected month', () => {
        mockStores.searchStore.searchWhen.from = new Date('2025-07-01');
        render(<MonthOption {...mockProps} />);

        const input = screen.getByTestId('July-2025-input');

        expect(input).toHaveProperty('checked', true);
        expect(input).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByTestId('July-2025-label')).toHaveClass('selectedMonthLabel');
    });

    it('should call onMonthChange when selected', () => {
        render(<MonthOption {...mockProps} />);

        fireEvent.click(screen.getByTestId('July-2025-input'));

        expect(mockProps.onMonthChange).toHaveBeenCalledWith(mockProps.month);
    });

    it('should set aria-hidden when not visible', () => {
        mockProps.isVisible = false;
        render(<MonthOption {...mockProps} />);

        expect(screen.getByTestId('July-2025-input')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should set correct accessibility attributes', () => {
        render(<MonthOption {...mockProps} />);

        const input = screen.getByTestId('July-2025-input');

        expect(input).toHaveAttribute('aria-checked', 'false');
        expect(input).toHaveAttribute('aria-disabled', 'false');
        expect(input).toHaveAttribute('aria-label', 'July 2025');
        expect(input).toHaveAttribute('aria-hidden', 'false');
    });

    it('should render cheapest price', () => {
        mockProps.month.cheapestMonthPrice = 100;

        render(<MonthOption {...mockProps} />);

        expect(screen.queryByTestId('option-old')).not.toBeInTheDocument();

        expect(screen.getByTestId('cheapest-month-price')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsFrom} £${mockProps.month.cheapestMonthPrice}`,
        );
        expect(screen.getByTestId('cheapest-month')).toHaveTextContent('CheapestMonthLabel');
        expect(screen.queryByTestId('month-unavailable')).not.toBeInTheDocument();
        expect(screen.queryByTestId('jss-image')).toBeInTheDocument();
        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(100, {
            roundUp: true,
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });
        expect(mockJSSImageNextProps).toHaveBeenCalledWith({
            field: {
                value: {
                    src: 'CheapestMonthIcon',
                },
            },
            fill: true,
            mediaSize: 'small',
        });
    });

    it('should render cheapest pricePP when shouldShowCheapestMonthTotalPrice is false', () => {
        mockProps.month.cheapestMonthPricePP = 50;
        mockStores.layoutStore.shouldShowCheapestMonthTotalPrice = false;

        render(<MonthOption {...mockProps} />);

        expect(screen.getByTestId('cheapest-month-price')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom} £${mockProps.month.cheapestMonthPricePP}`,
        );
    });

    it('should NOT render cheapest price if cheapestMonthPrice is 0', () => {
        render(<MonthOption {...mockProps} />);

        expect(screen.queryByTestId('cheapest-month-price')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cheapest-month')).not.toBeInTheDocument();
        expect(screen.queryByTestId('month-unavailable')).not.toBeInTheDocument();
    });

    it('should NOT render cheapest price if month is unavailable', () => {
        mockProps.month.availability = false;

        render(<MonthOption {...mockProps} />);

        expect(screen.queryByTestId('cheapest-month')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cheapest-month')).not.toBeInTheDocument();
        expect(screen.queryByTestId('month-unavailable')).toBeInTheDocument();
    });

    it('should render old option when isCheapestMonthPriceEnabled is false', () => {
        mockStores.layoutStore.isCheapestMonthPriceEnabled = false;

        render(<MonthOption {...mockProps} />);

        expect(screen.getByTestId('option-old')).toBeInTheDocument();
    });
});

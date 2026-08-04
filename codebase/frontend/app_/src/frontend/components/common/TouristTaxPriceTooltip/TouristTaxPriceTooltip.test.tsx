import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockMultiCurrencyTouristTaxFields, mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ITouristTaxPriceTooltipProps, TouristTaxPriceTooltip } from './TouristTaxPriceTooltip';

let mockStores;
let mockProps: ITouristTaxPriceTooltipProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceTokens: jest.fn(p => p),
    },
}));

const mockMultiCurrencyTokens = { '{touristTax}': '64.01' };
const mockSingleCurrencyTokens = { '{touristTax}': '10.01' };
const mockGetMultiCurrencyTokens = jest.fn().mockReturnValue(mockMultiCurrencyTokens);
const mockGetSingleCurrencyTokens = jest.fn().mockReturnValue(mockSingleCurrencyTokens);
jest.mock('./TouristTaxPriceTooltip.utils', () => ({
    __esModule: true,
    getMultiCurrencyTokens: (...args) => mockGetMultiCurrencyTokens(...args),
    getSingleCurrencyTokens: (...args) => mockGetSingleCurrencyTokens(...args),
}));

const mockTaxTooltip = jest.fn();
jest.mock('frontend/components/common/TouristTaxTooltip/TouristTaxTooltip', () => ({
    __esModule: true,
    TouristTaxTooltip: ({ children, dataId, ...props }) => {
        mockTaxTooltip(props);

        return <div data-tid={dataId}>{children}</div>;
    },
}));

describe('<TouristTaxPriceTooltip />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: { isTouristTaxEnabled: true },
        });
        mockProps = {
            touristTax: mockTouristTaxFields.touristTax,
            taxesAndFees: mockTouristTaxFields.taxesAndFees,
            children: <div data-tid='children' />,
            text: '',
        };
    });

    it('should render component when isTouristTaxEnabled is enabled', () => {
        render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(screen.getByTestId('tax-price-tooltip-label')).toBeInTheDocument();
    });

    it('should render children and correct tooltip when touristTax is provided', () => {
        render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(mockGetSingleCurrencyTokens).toHaveBeenCalledWith(
            mockTouristTaxFields.touristTax,
            Object.values(mockTouristTaxFields.taxesAndFees!)[0],
        );
        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(
            SitecoreDictionary.TouristTaxTooltipsExchangeTaxContent,
            mockSingleCurrencyTokens,
        );
        expect(mockTaxTooltip).toHaveBeenCalledWith({
            tooltipText: SitecoreDictionary.TouristTaxTooltipsExchangeTaxContent,
        });
    });

    it('should render correct tooltip when touristTax is 0', () => {
        mockProps.touristTax = 0;
        render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(mockTaxTooltip).toHaveBeenCalledWith({
            tooltipText: SitecoreDictionary.TouristTaxTooltipsNoTaxTooltip,
        });
    });

    it('should render only children when isTouristTaxEnabled is false', () => {
        mockStores.layoutStore.isTouristTaxEnabled = false;

        render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.queryByTestId('tax-price-tooltip-label')).not.toBeInTheDocument();
        expect(mockTaxTooltip).not.toHaveBeenCalled();
    });

    it('should pass triggerClassName to tax tooltip when triggerClassName is defined', () => {
        mockProps.triggerClassName = 'triggerClassName';
        render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(mockTaxTooltip).toHaveBeenCalledWith(
            expect.objectContaining({
                triggerClassName: mockProps.triggerClassName,
            }),
        );
    });

    it('should use custom text when it is provided', () => {
        mockProps.text = 'Custom tooltip text';

        render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(mockTaxTooltip).toHaveBeenCalledWith(
            expect.objectContaining({
                tooltipText: mockProps.text,
            }),
        );
    });

    it('should NOT render when tourist-tax is -1', () => {
        mockProps.touristTax = -1;

        const { container } = render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render only children when touristTax is positive but taxesAndFees is undefined', () => {
        mockProps.taxesAndFees = undefined;

        render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(mockTaxTooltip).not.toHaveBeenCalled();
    });

    it('should render correct multi-currency tooltip when taxesAndFees has multiple currencies', () => {
        mockProps.touristTax = mockMultiCurrencyTouristTaxFields.touristTax;
        mockProps.taxesAndFees = mockMultiCurrencyTouristTaxFields.taxesAndFees;

        render(<TouristTaxPriceTooltip {...mockProps} />);

        expect(mockGetMultiCurrencyTokens).toHaveBeenCalledWith(
            mockMultiCurrencyTouristTaxFields.touristTax,
            mockMultiCurrencyTouristTaxFields.taxesAndFees,
            SitecoreDictionary.GlobalConjunctionsAnd,
        );
        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(
            SitecoreDictionary.TouristTaxTooltipsMultiCurrencyContent,
            mockMultiCurrencyTokens,
        );
        expect(mockTaxTooltip).toHaveBeenCalledWith({
            tooltipText: SitecoreDictionary.TouristTaxTooltipsMultiCurrencyContent,
        });
    });
});

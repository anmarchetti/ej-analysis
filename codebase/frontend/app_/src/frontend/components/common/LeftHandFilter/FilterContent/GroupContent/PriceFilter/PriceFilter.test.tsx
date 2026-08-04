import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrailingZeroDisplay } from 'code/currency';
import * as utils from 'frontend/utils/sort.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { PriceFilter } from './PriceFilter';

jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: ({ label, label2, onChange }) => (
        <button onClick={() => onChange({ target: { checked: false } })} onKeyDown={jest.fn()} data-tid='checkbox'>
            <span>{label}</span>
            <span>{label2}</span>
        </button>
    ),
}));

const mockCompoundSlider = jest.fn();
jest.mock('./CompoundSlider', () => ({
    __esModule: true,
    default: ({ onSlide, onSliding, getValue, ...props }) => {
        mockCompoundSlider(props);

        return (
            <div data-tid='compound-slider'>
                <button onClick={() => onSlide([10, 20])} onKeyDown={jest.fn()} data-tid='compound-slider-slide' />
                <button onClick={() => onSliding([10, 20])} onKeyDown={jest.fn()} data-tid='compound-slider-sliding' />
                <button onClick={() => getValue(20000)} onKeyDown={jest.fn()} data-tid='compound-slider-get-value' />
            </div>
        );
    },
}));

const mockSortPrice = jest.spyOn(utils, 'sortPrice').mockReturnValue([0, 1]);

describe('PriceFilter', () => {
    const resetMocks = () =>
        ({
            minPrice: 250,
            maxPrice: 450,
            minPricePp: 50,
            maxPricePp: 90,
            guests: 2,
            numberOfHotels: 14,
            isPricePerPerson: true,
            setPriceFiltersValue: jest.fn(),
            isScreenMedium: false,
            valueFrom: null,
            valueTo: null,
            onChange: jest.fn(),
            getPhrase: jest.fn(p => p),
            getCurrencySymbol: jest.fn(() => '£'),
            formatMoney: jest.fn(p => p),
            getFormattedNumber: jest.fn(p => p),
            onChangeOffersPriceView: jest.fn(),
        } as any);

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<PriceFilter {...mocks} />);

        expect(mocks.formatMoney).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('price-range-filter-container')).toBeInTheDocument();
        expect(screen.getByTestId('price-switcher')).toBeInTheDocument();
        expect(screen.getByTestId('price-range-row')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox')).toBeInTheDocument();
        expect(screen.getByTestId('compound-slider')).toBeInTheDocument();
        expect(screen.getByText(`£ ${SitecoreDictionary.SearchPodFiltersLabelsPricePerPerson}`)).toBeInTheDocument();
        expect(screen.getByText(`£ ${SitecoreDictionary.SearchPodFiltersLabelsPriceTotal}`)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchPodFiltersLabelsPriceShowHolidaysBetween)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalConjunctionsAnd)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchPodFiltersLabelsPricePerPerson)).toBeInTheDocument();
        expect(screen.getAllByRole('spinbutton')).toHaveLength(2);

        expect(screen.getByLabelText(SitecoreDictionary.AccessibilityAriaLabelsPriceMinInput)).toBeInTheDocument();
        expect(screen.getByLabelText(SitecoreDictionary.AccessibilityAriaLabelsPriceMaxInput)).toBeInTheDocument();

        expect(mockCompoundSlider).toHaveBeenCalledWith(
            expect.objectContaining({
                values: [50, 90],
            }),
        );
    });

    it('should render CompoundSlider with values capped on minPrice when valueFrom and valueTo are lower than minPrice', () => {
        mocks.valueFrom = 1;
        mocks.valueTo = 2;
        render(<PriceFilter {...mocks} />);

        expect(screen.getByTestId('compound-slider')).toBeInTheDocument();
        expect(mockCompoundSlider).toHaveBeenCalledWith(
            expect.objectContaining({
                values: [50, 50],
            }),
        );
    });

    it('should render CompoundSlider with values capped on min and max price when valueFrom and valueTo are higher than maxPrice', () => {
        mocks.valueFrom = 60;
        mocks.valueTo = 100;
        render(<PriceFilter {...mocks} />);

        expect(screen.getByTestId('compound-slider')).toBeInTheDocument();
        expect(mockCompoundSlider).toHaveBeenCalledWith(
            expect.objectContaining({
                values: [60, 90],
            }),
        );
    });

    it('should NOT render checkbox when pricePP is NOT shown', () => {
        mocks.guests = 1;

        render(<PriceFilter {...mocks} />);

        expect(mocks.formatMoney).toHaveBeenCalledTimes(2);

        expect(screen.getByText(SitecoreDictionary.SearchPodFiltersLabelsPriceTotal)).toBeInTheDocument();
        expect(screen.queryByTestId('checkbox')).not.toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.SearchPodFiltersLabelsPricePerPerson)).not.toBeInTheDocument();
        expect(screen.queryByText(`£ ${SitecoreDictionary.SearchPodFiltersLabelsPriceTotal}`)).not.toBeInTheDocument();
        expect(
            screen.queryByText(`£ ${SitecoreDictionary.SearchPodFiltersLabelsPricePerPerson}`),
        ).not.toBeInTheDocument();
    });

    it('should call setPriceFiltersValue and onChange on first input blur when valueFrom and valueTo is NOT equal to sortPrice values', async () => {
        render(<PriceFilter {...mocks} />);

        const input = screen.getAllByRole('spinbutton')[0];
        await userEvent.type(input, 'test');
        await userEvent.tab();

        expect(mocks.setPriceFiltersValue).toHaveBeenCalled();
        expect(mocks.onChange).toHaveBeenCalled();
    });

    it('should call setPriceFiltersValue and NOT call onChange on first input blur when valueFrom and valueTo is equal to sortPrice values', async () => {
        mocks.valueFrom = 0;
        mocks.valueTo = 1;

        render(<PriceFilter {...mocks} />);

        const input = screen.getAllByRole('spinbutton')[0];
        await userEvent.type(input, 'test');
        await userEvent.tab();

        expect(mocks.setPriceFiltersValue).toHaveBeenCalled();
        expect(mocks.onChange).not.toHaveBeenCalled();
    });

    it('should update values on type on first input', async () => {
        mocks.valueFrom = 0;
        mocks.valueTo = 1;

        const { rerender } = render(<PriceFilter {...mocks} />);

        const input = screen.getAllByRole('spinbutton')[0];
        await userEvent.type(input, '100');

        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(3);
    });

    it('should update values on isPricePerPerson change when isPricePPShown is true', () => {
        const { rerender } = render(<PriceFilter {...mocks} />);

        mocks.isPricePerPerson = false;

        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(4);
    });

    it('should NOT update values on isPricePerPerson change when isPricePPShown is false', () => {
        mocks.guests = 1;

        const { rerender } = render(<PriceFilter {...mocks} />);

        mocks.isPricePerPerson = false;

        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(3);
    });

    it('should call setPriceFiltersValue and onChange on second input blur when valueFrom and valueTo is NOT equal to sortPrice values', async () => {
        render(<PriceFilter {...mocks} />);

        const input = screen.getAllByRole('spinbutton')[1];
        await userEvent.type(input, 'test');
        await userEvent.tab();

        expect(mocks.setPriceFiltersValue).toHaveBeenCalled();
        expect(mocks.onChange).toHaveBeenCalled();
    });

    it('should call setPriceFiltersValue and NOT call onChange on second input blur when valueFrom and valueTo is equal to sortPrice values', async () => {
        mocks.valueFrom = 0;
        mocks.valueTo = 1;

        render(<PriceFilter {...mocks} />);

        const input = screen.getAllByRole('spinbutton')[1];
        await userEvent.type(input, 'test');
        await userEvent.tab();

        expect(mocks.setPriceFiltersValue).toHaveBeenCalled();
        expect(mocks.onChange).not.toHaveBeenCalled();
    });

    it('should update values on type on second input', async () => {
        mocks.minPricePp = 1;
        mocks.maxPricePp = 2000;

        const { rerender } = render(<PriceFilter {...mocks} />);

        const input = screen.getAllByRole('spinbutton')[1];
        await userEvent.type(input, '80');

        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(3);
    });

    it('should call sortPrice twice on component update when valueFrom changes', () => {
        const { rerender } = render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        mocks.valueFrom = 0;
        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(4);
    });

    it('should call sortPrice twice on component update when valueTo changes', () => {
        const { rerender } = render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        mocks.valueTo = 2;
        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(4);
    });

    it('should call sortPrice twice on component update when maxPrice changes', () => {
        const { rerender } = render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        mocks.maxPrice = 200;
        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(4);
    });

    it('should call sortPrice twice on component update when minPrice changes', () => {
        const { rerender } = render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        mocks.minPrice = 200;
        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(4);
    });

    it('should call sortPrice once on component update when props do NOT change', () => {
        const { rerender } = render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        rerender(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(3);
    });

    it('should call sortPrice twice onSlide', async () => {
        render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        await userEvent.click(screen.getByTestId('compound-slider-slide'));

        expect(mockSortPrice).toHaveBeenCalledTimes(4);
    });

    it('should call sortPrice once onSliding', async () => {
        render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        await userEvent.click(screen.getByTestId('compound-slider-sliding'));

        expect(mockSortPrice).toHaveBeenCalledTimes(3);
    });

    it('should call formatMoney once on getSliderValue', async () => {
        render(<PriceFilter {...mocks} />);

        expect(mocks.formatMoney).toHaveBeenCalledTimes(2);

        await userEvent.click(screen.getByTestId('compound-slider-get-value'));

        expect(mocks.formatMoney).toHaveBeenNthCalledWith(3, 20000, {
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });
    });

    it('should call sortPrice 3 times and onChangeOffersPriceView onSwitch when isPricePerPerson is NOT equal to checkbox status', async () => {
        render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        await userEvent.click(screen.getByTestId('checkbox'));

        expect(mockSortPrice).toHaveBeenCalledTimes(5);
        expect(mocks.onChangeOffersPriceView).toHaveBeenCalled();
    });

    it('should NOT call sortPrice and onChangeOffersPriceView onSwitch when isPricePerPerson is equal to checkbox status', async () => {
        mocks.isPricePerPerson = false;
        render(<PriceFilter {...mocks} />);

        expect(mockSortPrice).toHaveBeenCalledTimes(2);

        await userEvent.click(screen.getByTestId('checkbox'));

        expect(mockSortPrice).toHaveBeenCalledTimes(2);
        expect(mocks.onChangeOffersPriceView).not.toHaveBeenCalled();
    });

    it('hides count if isCountHidden = true', () => {
        mocks.isCountHidden = true;
        render(<PriceFilter {...mocks} />);

        expect(
            screen.queryByText(new RegExp(SitecoreDictionary.SearchPodFiltersLabelsPriceResults, 'i')),
        ).not.toBeInTheDocument();
    });

    it('shows right title on the amendHotelPage', () => {
        mocks.isAmendHotelPage = true;
        render(<PriceFilter {...mocks} />);

        expect(
            screen.queryByText(SitecoreDictionary.SearchPodFiltersLabelsPriceShowHolidaysBetween),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.SearchPodFiltersLabelsPriceShowHotelsBetween)).toBeInTheDocument();
    });
});

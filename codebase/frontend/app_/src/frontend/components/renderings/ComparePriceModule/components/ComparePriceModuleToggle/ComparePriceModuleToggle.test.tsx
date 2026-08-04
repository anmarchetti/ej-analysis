import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import { ComparePriceModuleToggle, IComparePriceModuleToggleProps } from './ComparePriceModuleToggle';

const mockCheckboxComponent = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: props => {
        mockCheckboxComponent(props);

        return (
            <button data-tid='checkbox-toggle' onClick={props.onChange} aria-checked={props.checked}>
                {props.label} / {props.label2}
            </button>
        );
    },
}));

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IComparePriceModuleToggleProps => ({
    cheapestRoomLabel: 'Cheapest Room',
    isEnabled: true,
    keepRoomLabel: 'Keep Room',
    onReload: jest.fn().mockResolvedValue(undefined),
    selectedDate: new Date('2024-01-01'),
    setActiveDate: jest.fn(),
});

describe('<ComparePriceModuleToggle />', () => {
    let props: IComparePriceModuleToggleProps;

    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isCheapestComparePriceOption: false,
                setIsCheapestComparePriceOption: jest.fn(),
            },
            comparePricesCalendarStore: {
                resetToInitial: jest.fn(),
            },
            priceGraphStore: {
                clearAlternativeOffers: jest.fn(),
            },
        });
    });

    describe('Rendering', () => {
        it('should render the toggle when isEnabled is true', () => {
            render(<ComparePriceModuleToggle {...props} />);

            expect(screen.getByTestId('compare-price-module-toggle')).toBeInTheDocument();
            expect(screen.getByTestId('checkbox-toggle')).toBeInTheDocument();
        });

        it('should NOT render when isEnabled is false', () => {
            props.isEnabled = false;

            const { container } = render(<ComparePriceModuleToggle {...props} />);

            expect(container.firstChild).toBeNull();
            expect(screen.queryByTestId('compare-price-module-toggle')).not.toBeInTheDocument();
            expect(screen.queryByTestId('checkbox-toggle')).not.toBeInTheDocument();
        });

        it('should render with correct data-tid attribute', () => {
            render(<ComparePriceModuleToggle {...props} />);

            const wrapper = screen.getByTestId('compare-price-module-toggle');

            expect(wrapper).toHaveAttribute('data-tid', 'compare-price-module-toggle');
        });

        it('should render Checkbox component with toggle prop', () => {
            render(<ComparePriceModuleToggle {...props} />);

            expect(mockCheckboxComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    toggle: true,
                }),
            );
        });
    });

    describe('Labels', () => {
        it('should pass keepRoomLabel as label prop to Checkbox', () => {
            render(<ComparePriceModuleToggle {...props} />);

            expect(mockCheckboxComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Keep Room',
                }),
            );
        });

        it('should pass cheapestRoomLabel as label2 prop to Checkbox', () => {
            render(<ComparePriceModuleToggle {...props} />);

            expect(mockCheckboxComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    label2: 'Cheapest Room',
                }),
            );
        });

        it('should display both labels in the rendered output', () => {
            render(<ComparePriceModuleToggle {...props} />);

            expect(screen.getByText('Keep Room / Cheapest Room')).toBeInTheDocument();
        });
    });

    describe('Checked State', () => {
        it('should show checkbox as checked when isCheapest is false (Keep Room mode)', () => {
            mockStores.layoutStore.isCheapestComparePriceOption = false;

            render(<ComparePriceModuleToggle {...props} />);

            expect(mockCheckboxComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    checked: true,
                }),
            );

            const checkbox = screen.getByTestId('checkbox-toggle');

            expect(checkbox).toHaveAttribute('aria-checked', 'true');
        });

        it('should show checkbox as unchecked when isCheapest is true (Cheapest Room mode)', () => {
            mockStores.layoutStore.isCheapestComparePriceOption = true;

            render(<ComparePriceModuleToggle {...props} />);

            expect(mockCheckboxComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    checked: false,
                }),
            );

            const checkbox = screen.getByTestId('checkbox-toggle');

            expect(checkbox).toHaveAttribute('aria-checked', 'false');
        });
    });

    describe('Toggle Click Behavior', () => {
        describe('From Keep Room to Cheapest Room', () => {
            it('should call all store methods and onReload when toggling from Keep Room to Cheapest Room', async () => {
                mockStores.layoutStore.isCheapestComparePriceOption = false;

                render(<ComparePriceModuleToggle {...props} />);

                const checkbox = screen.getByTestId('checkbox-toggle');

                await userEvent.click(checkbox);

                expect(props.setActiveDate).toHaveBeenCalledWith(props.selectedDate);
                expect(mockStores.comparePricesCalendarStore.resetToInitial).toHaveBeenCalled();
                expect(mockStores.priceGraphStore.clearAlternativeOffers).toHaveBeenCalled();
                expect(mockStores.layoutStore.setIsCheapestComparePriceOption).toHaveBeenCalledWith(true);
                expect(props.onReload).toHaveBeenCalled();
            });
        });

        describe('From Cheapest Room to Keep Room', () => {
            it('should call all store methods and onReload when toggling from Cheapest Room to Keep Room', async () => {
                mockStores.layoutStore.isCheapestComparePriceOption = true;

                render(<ComparePriceModuleToggle {...props} />);

                const checkbox = screen.getByTestId('checkbox-toggle');

                await userEvent.click(checkbox);

                expect(props.setActiveDate).toHaveBeenCalledWith(props.selectedDate);
                expect(mockStores.comparePricesCalendarStore.resetToInitial).toHaveBeenCalled();
                expect(mockStores.priceGraphStore.clearAlternativeOffers).toHaveBeenCalled();
                expect(mockStores.layoutStore.setIsCheapestComparePriceOption).toHaveBeenCalledWith(false);
                expect(props.onReload).toHaveBeenCalled();
            });
        });
    });

    describe('Props Verification', () => {
        it('should pass all required props to Checkbox component', () => {
            render(<ComparePriceModuleToggle {...props} />);

            expect(mockCheckboxComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    toggle: true,
                    onChange: expect.any(Function),
                    label: 'Keep Room',
                    label2: 'Cheapest Room',
                    checked: true,
                }),
            );
        });
    });

    describe('CSS Classes and Styling', () => {
        it('should apply toggleWithoutTax class when hasTouristTaxLabel is false', () => {
            props.hasTouristTaxLabel = false;

            render(<ComparePriceModuleToggle {...props} />);

            expect(screen.getByTestId('compare-price-module-toggle')).toHaveClass('toggleWithoutTax');
        });

        it('should NOT apply toggleWithoutTax class when hasTouristTaxLabel is true', () => {
            props.hasTouristTaxLabel = true;

            render(<ComparePriceModuleToggle {...props} />);

            expect(screen.getByTestId('compare-price-module-toggle')).not.toHaveClass('toggleWithoutTax');
        });

        it('should apply both toggleWrapperGraph and toggleWithoutTax when isGraphView=true and hasTouristTaxLabel=false', () => {
            props.isGraphView = true;
            props.hasTouristTaxLabel = false;

            render(<ComparePriceModuleToggle {...props} />);

            const wrapper = screen.getByTestId('compare-price-module-toggle');

            expect(wrapper).toHaveClass('toggleWrapperGraph');
            expect(wrapper).toHaveClass('toggleWithoutTax');
        });

        it('should apply toggleWithoutTax when hasTouristTaxLabel is undefined (defaults to falsy)', () => {
            props.hasTouristTaxLabel = undefined;

            render(<ComparePriceModuleToggle {...props} />);

            expect(screen.getByTestId('compare-price-module-toggle')).toHaveClass('toggleWithoutTax');
        });
    });
});

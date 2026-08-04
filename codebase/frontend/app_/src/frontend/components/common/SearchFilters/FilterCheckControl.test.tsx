import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import FilterCheckControl, { IFilterCheckControlProps } from './FilterCheckControl';

const mockCheckboxComponent = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: props => {
        mockCheckboxComponent(props);

        return (
            <div>
                <input type='checkbox' onChange={props.onChange} />
                {props.children}
                {props.render()}
            </div>
        );
    },
}));

const mockRadioButtonComponent = jest.fn();
jest.mock('frontend/components/common/RadioButton', () => ({
    __esModule: true,
    default: props => {
        mockRadioButtonComponent(props);

        return (
            <div>
                <input type='radio' onChange={props.onChange} />
                {props.label}
            </div>
        );
    },
}));

const mockCalloutComponent = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: props => {
        mockCalloutComponent(props);

        return <div data-tid='callout-component'>{props.children}</div>;
    },
}));

const resetMocks = () =>
    ({
        option: {
            code: 'code',
            count: 1,
            name: 'name',
            groupCode: FilterGroupCodes.BoardType,
            icon: 'icon',
            tooltipOrientation: CalloutOrientation.Top,
            tooltipPosition: CalloutPosition.IconLeft,
        },
        label: 'test',
        checked: false,
        disabled: false,
        isRadioButton: false,
        onChange: jest.fn(),
        hiddenZeroCount: false,
        isScreenLessMedium: false,
        getFormattedNumber: jest.fn(number => `${number}`),
    } as IFilterCheckControlProps);

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('FilterContent', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('should render Checkbox and call onChange', () => {
        render(<FilterCheckControl {...mocks} />);

        expect(mockCheckboxComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: mocks.disabled,
                checked: mocks.checked,
                tick: true,
                medium: true,
            }),
        );
        expect(screen.getByText(mocks.label)).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-icon')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('checkbox'));

        expect(mocks.onChange).toHaveBeenCalled();
    });

    it('should render RadioButton and call onChange', () => {
        mocks.isRadioButton = true;

        render(<FilterCheckControl {...mocks} />);

        expect(mockRadioButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                checked: mocks.checked,
                label: mocks.label,
            }),
        );

        fireEvent.click(screen.getByRole('radio'));

        expect(mocks.onChange).toHaveBeenCalled();
    });

    describe('getLabel', () => {
        it('should render option.name', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = true;

            render(<FilterCheckControl {...mocks} />);

            expect(mockRadioButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: mocks.option.name,
                }),
            );
            expect(screen.getByText(mocks.option.name)).toBeInTheDocument();
        });

        it('should render option.code', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.option.name = undefined;
            mocks.hideLabelCount = true;

            render(<FilterCheckControl {...mocks} />);

            expect(mockRadioButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: mocks.option.code,
                }),
            );
            expect(screen.getByText(mocks.option.code)).toBeInTheDocument();
        });

        it('should render option.name with option.count', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = false;

            render(<FilterCheckControl {...mocks} />);

            expect(screen.getByText(`${mocks.option.name} (${mocks.option.count})`)).toBeInTheDocument();
        });

        it('should render option.code with option.count', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = false;
            mocks.option.name = undefined;

            render(<FilterCheckControl {...mocks} />);

            expect(screen.getByText(`${mocks.option.code} (${mocks.option.count})`)).toBeInTheDocument();
        });

        it('should render option.name without option.count when filter is destination', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = false;
            mocks.option.groupCode = FilterGroupCodes.Destination;

            render(<FilterCheckControl {...mocks} />);

            expect(screen.getByText(mocks.option.name)).toBeInTheDocument();
            expect(screen.queryByText(mocks.option.count)).not.toBeInTheDocument();
        });

        it('should render option.name without option.count when option.count is less than 0 and hiddenZeroCount is false', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = false;
            mocks.option.count = -1;
            mocks.hiddenZeroCount = true;

            render(<FilterCheckControl {...mocks} />);

            expect(screen.getByText(mocks.option.name)).toBeInTheDocument();
            expect(screen.queryByText(mocks.option.count)).not.toBeInTheDocument();
        });
    });

    describe('renderTooltip', () => {
        it('Should not render tooltip when option.tooltipText is not defined', () => {
            mocks.option.tooltipText = undefined;

            render(<FilterCheckControl {...mocks} />);

            expect(screen.queryByTestId('callout-component')).not.toBeInTheDocument();
        });

        it('should render tooltip when there is option.tooltipText', () => {
            mocks.option.tooltipText = 'test';

            render(<FilterCheckControl {...mocks} />);

            expect(mockCalloutComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        type: 'div',
                        props: expect.objectContaining({
                            children: mocks.option.tooltipText,
                        }),
                    }),
                    orientation: mocks.option.tooltipOrientation,
                    position: mocks.option.tooltipPosition,
                    isShownOnHover: true,
                }),
            );
            expect(screen.getByTestId('callout-component')).toBeInTheDocument();
        });

        it('should render content of tooltip specific to Hotel Types filter', () => {
            mocks.option.tooltipText = 'tooltip';
            mocks.option.groupCode = FilterGroupCodes.HotelTypes;

            render(<FilterCheckControl {...mocks} />);

            expect(mockCalloutComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        type: 'div',
                        props: expect.objectContaining({
                            'data-tid': 'callout-content-hotel-types',
                        }),
                    }),
                    orientation: CalloutOrientation.Top,
                    position: CalloutPosition.IconLeft,
                    isShownOnHover: true,
                }),
            );
            expect(screen.getByTestId('callout-component')).toBeInTheDocument();
        });

        it('should not render checkbox icon if Hotel Types filter is applied', () => {
            mocks.option.tooltipText = 'tooltip';
            mocks.option.groupCode = FilterGroupCodes.HotelTypes;

            render(<FilterCheckControl {...mocks} />);

            expect(screen.queryByTestId('checkbox-icon')).not.toBeInTheDocument();
        });

        it('should receive isShownOnHover as false when isScreenLessMedium is true', () => {
            mocks.option.tooltipText = 'tooltip';
            mockStores.appStore.isScreenLessMedium = true;

            render(<FilterCheckControl {...mocks} />);

            expect(mockCalloutComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isShownOnHover: false,
                }),
            );
        });
    });

    it('should create label with count of variants when label is not provide', () => {
        mocks.label = null;
        mocks.hideLabelCount = false;

        render(<FilterCheckControl {...mocks} />);

        expect(screen.getByText(`${mocks.option.name} (${mocks.option.count})`)).toBeInTheDocument();
    });

    it('should create zero label with count is undefined', () => {
        mocks.label = null;
        mocks.hideLabelCount = false;
        mocks.option.count = undefined;

        render(<FilterCheckControl {...mocks} />);

        expect(screen.getByText(`${mocks.option.name} (0)`)).toBeInTheDocument();
    });

    it('should create label without count of variants when label is not provide and hideLabelCount is true', () => {
        mocks.label = null;
        mocks.hideLabelCount = true;

        render(<FilterCheckControl {...mocks} />);

        expect(screen.getByText(mocks.option.name)).toBeInTheDocument();
    });
});

import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
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
            <div data-tid='radio-button'>
                <input type='radio' onChange={props.onChange} />
                {props.label}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: () => <div data-tid='tooltip' />,
}));

const mockNewItemPill = jest.fn();
jest.mock('frontend/components/common/Pills/NewItemPill/NewItemPill', () => ({
    __esModule: true,
    default: props => {
        mockNewItemPill(props);

        return <div data-tid='new-item-pill' />;
    },
}));

const mockTextWithTooltip = jest.fn();
jest.mock('frontend/components/common/TextWithTooltip/TextWithTooltip', () => ({
    __esModule: true,
    default: props => {
        mockTextWithTooltip(props);

        return <div data-tid='text-with-tooltip' />;
    },
}));

const resetMocks = (): IFilterCheckControlProps =>
    ({
        option: {
            code: 'code',
            count: 1,
            name: 'name',
            groupCode: FilterGroupCodes.BoardType,
            icon: 'icon',
            tooltipText: 'tooltip text',
        },
        label: 'test',
        checked: false,
        disabled: false,
        isRadioButton: false,
        onChange: jest.fn(),
        hiddenZeroCount: false,
        isScreenMedium: false,
    } as IFilterCheckControlProps);

let mocks = resetMocks();
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
                id: 'boardTypecode',
            }),
        );
        expect(screen.getByText('test')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-icon')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('checkbox'));

        expect(mocks.onChange).toHaveBeenCalled();
    });

    it('should render NewItemPill in checkbox with undefined isShown when showNewLabel is NOT provided', () => {
        render(<FilterCheckControl {...mocks} />);

        expect(screen.getByTestId('new-item-pill')).toBeInTheDocument();
        expect(mockNewItemPill).toHaveBeenCalledWith({ className: 'newLabelPill', isShown: undefined });
    });

    it('should render NewItemPill in checkbox with true isShown when showNewLabel is provided', () => {
        mocks.option.showNewLabel = true;

        render(<FilterCheckControl {...mocks} />);

        expect(screen.getByTestId('new-item-pill')).toBeInTheDocument();
        expect(mockNewItemPill).toHaveBeenCalledWith({ className: 'newLabelPill', isShown: true });
    });

    it('should render container with code data-tid and checkbox-item class', () => {
        render(<FilterCheckControl {...mocks} />);

        expect(screen.getByTestId('code')).toHaveClass('checkbox-item');
    });

    it('should render container with code data-tid and disabled class when disabled is true', () => {
        mocks.disabled = true;

        render(<FilterCheckControl {...mocks} />);

        expect(screen.getByTestId('code')).toHaveClass('disabled');
    });

    it('should render RadioButton and call onChange', () => {
        mocks.isRadioButton = true;

        render(<FilterCheckControl {...mocks} />);

        expect(mockRadioButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                checked: mocks.checked,
                label: expect.anything(),
                id: 'boardTypecode',
                name: 'boardTypecode',
            }),
        );
        expect(screen.getByTestId('radio-button')).toHaveTextContent('test');

        fireEvent.click(screen.getByRole('radio'));

        expect(mocks.onChange).toHaveBeenCalled();
    });

    describe('getLabel', () => {
        it('should render option.name', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = true;

            render(<FilterCheckControl {...mocks} />);

            expect(mockTextWithTooltip).toHaveBeenCalledWith({
                wrapperClassName: 'count',
                message: mocks.option.name,
                tooltipMessage: mocks.option.tooltipText,
                tag: 'div',
            });
        });

        it('should render option.code', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.option.name = '';
            mocks.hideLabelCount = true;

            render(<FilterCheckControl {...mocks} />);

            expect(mockTextWithTooltip).toHaveBeenCalledWith({
                wrapperClassName: 'count',
                message: mocks.option.code,
                tooltipMessage: mocks.option.tooltipText,
                tag: 'div',
            });
        });

        it('should render option.name with option.count', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = false;

            render(<FilterCheckControl {...mocks} />);

            expect(mockTextWithTooltip).toHaveBeenCalledWith({
                wrapperClassName: 'count',
                message: `${mocks.option.name} (${mocks.option.count})`,
                tooltipMessage: mocks.option.tooltipText,
                tag: 'div',
            });
        });

        it('should render option.code with option.count', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = false;
            mocks.option.name = '';

            const getFormattedNumber = jest.spyOn(mockStores.marketStore, 'getFormattedNumber');

            render(<FilterCheckControl {...mocks} />);

            expect(getFormattedNumber).toHaveBeenCalledWith(1);
            expect(mockTextWithTooltip).toHaveBeenCalledWith({
                wrapperClassName: 'count',
                message: `${mocks.option.code} (${mocks.option.count})`,
                tooltipMessage: mocks.option.tooltipText,
                tag: 'div',
            });
        });

        it('should call getFormattedNumber with 0 when count and label are NOT provided and hideLabelCount is false', () => {
            mocks.label = undefined;
            mocks.hideLabelCount = false;
            mocks.option.count = 0;

            const getFormattedNumber = jest.spyOn(mockStores.marketStore, 'getFormattedNumber');

            render(<FilterCheckControl {...mocks} />);

            expect(getFormattedNumber).toHaveBeenCalledWith(0);
        });

        it('should render option.name without option.count when filter is destination', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = false;
            mocks.option.groupCode = FilterGroupCodes.Destination;

            render(<FilterCheckControl {...mocks} />);

            expect(mockTextWithTooltip).toHaveBeenCalledWith({
                wrapperClassName: 'count',
                message: mocks.option.name,
                tooltipMessage: mocks.option.tooltipText,
                tag: 'div',
            });
        });

        it('should render option.name without option.count when option.count is less than 0 and hiddenZeroCount is false', () => {
            mocks.isRadioButton = true;
            mocks.label = undefined;
            mocks.hideLabelCount = false;
            mocks.option.count = -1;
            mocks.hiddenZeroCount = true;

            render(<FilterCheckControl {...mocks} />);

            expect(mockTextWithTooltip).toHaveBeenCalledWith({
                wrapperClassName: 'count',
                message: mocks.option.name,
                tooltipMessage: mocks.option.tooltipText,
                tag: 'div',
            });
        });
    });

    describe('Tooltip', () => {
        it('should NOT be rendered when option.tooltipText is undefined', () => {
            mocks.option.tooltipText = undefined;

            render(<FilterCheckControl {...mocks} />);

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });

        it('should be rendered when option.tooltipText is defined', () => {
            mocks.option.tooltipText = 'tooltip text';

            render(<FilterCheckControl {...mocks} />);

            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        });
    });
});

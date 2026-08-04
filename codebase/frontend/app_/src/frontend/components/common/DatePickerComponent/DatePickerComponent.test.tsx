import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IDatePickerComponentProps } from 'models/data/IDataPicker';
import { TDatePickerAnswer } from 'models/data/IHolidayInspiration';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import useReactDataPickerFocus from 'frontend/components/renderings/SearchPod/hooks/useReactDataPickerFocus';

import DatePickerComponent, { TWO_MONTHS_DATE_PICKER_MIN_WIDTH } from './DatePickerComponent';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

type TOnChangeDatePicker = Date & TDatePickerAnswer & Date[];
const mockDatepickerProps = jest.fn();
const mockSetPreSelection = jest.fn();
jest.mock('react-datepicker', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef((props: any, ref: any) => {
            mockDatepickerProps(props);

            ref.current = {
                setPreSelection: mockSetPreSelection,
                ...ref.current,
            };

            return (
                <div data-tid='react-datepicker' className={props.calendarClassName}>
                    {props.renderCustomHeader()}
                    <div className='react-datepicker__month'>
                        <button
                            onClick={() => {
                                props.onChange?.([
                                    new Date('08.10.2024'),
                                    new Date('09.10.2024'),
                                ] as TOnChangeDatePicker);
                            }}
                            tabIndex={0}
                            className='react-datepicker__day'
                        >
                            from 08.10.2024 to 09.10.2024
                        </button>
                        <button
                            onClick={() => {
                                props.onChange?.([
                                    new Date('08.10.2024'),
                                    new Date('08.10.2024'),
                                ] as TOnChangeDatePicker);
                            }}
                            className='react-datepicker__day'
                        >
                            from 08.10.2024 to 08.10.2024
                        </button>
                    </div>
                </div>
            );
        }),
    };
});

const mockMonthHeaderProps = jest.fn();
jest.mock('./components/MonthHeader/MonthHeader.tsx', () => props => {
    mockMonthHeaderProps(props);

    return <div data-tid='month-header' />;
});

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ children }) => <div>{children}</div>,
}));

let mockContainerWidth = { width: 1000 };
jest.mock('frontend/hooks/useResize', () => ({
    __esModule: true,
    default: () => mockContainerWidth,
}));

jest.mock('frontend/components/renderings/SearchPod/hooks/useReactDataPickerFocus');

jest.mock('frontend/components/common/FlyingPlaneAnimation/FlyingPlaneAnimation', () => () => (
    <div data-tid='flying-plane-animation' />
));

const createProps = (): IDatePickerComponentProps => ({
    minDate: new Date('2024-10-08'),
    maxDate: new Date('2025-10-08'),
    selectedDates: [undefined, undefined],
    excludedDates: [],
    isLoading: false,
    onChange: jest.fn(),
    onChangeShownDates: jest.fn(),
    changeMonthButtonLabel: mockSitecoreField(''),
});
let mockProps;
let mockStores;

describe('DatePickerComponent', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it(`should render two month when data picker wrapper width more then ${TWO_MONTHS_DATE_PICKER_MIN_WIDTH}`, () => {
        render(<DatePickerComponent {...mockProps} />);

        expect(mockDatepickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                monthsShown: 2,
                calendarClassName: 'datePicker',
            }),
        );

        expect(mockMonthHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOneMonthView: false,
            }),
        );
    });

    it(`should render one month when data picker wrapper width less then ${TWO_MONTHS_DATE_PICKER_MIN_WIDTH}`, () => {
        mockContainerWidth = { width: 300 };
        render(<DatePickerComponent {...mockProps} />);

        expect(mockDatepickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                monthsShown: 1,
                calendarClassName: 'datePicker oneMonth',
            }),
        );

        expect(mockMonthHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOneMonthView: true,
            }),
        );
    });

    it('should render animation while loading', () => {
        mockProps.isLoading = true;
        render(<DatePickerComponent {...mockProps} />);

        expect(screen.getByTestId('flying-plane-animation')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsLabelsLoading)).toBeInTheDocument();
    });

    describe('startDate ', () => {
        // mismatch of types in the library itself
        it('should pass undefined to lib when start date is null', () => {
            render(<DatePickerComponent {...mockProps} />);

            expect(mockDatepickerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    startDate: undefined,
                }),
            );
        });

        it('should pass start date lib when it exist', () => {
            const date = new Date('2024-10-08');
            mockProps.selectedDates = [date, null];
            render(<DatePickerComponent {...mockProps} />);

            expect(mockDatepickerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    startDate: date,
                }),
            );
        });
    });

    describe('onChange ', () => {
        it('should call onChange when user pick up date', async () => {
            render(<DatePickerComponent {...mockProps} />);

            await userEvent.click(screen.getByRole('button', { name: 'from 08.10.2024 to 09.10.2024' }));

            expect(mockProps.onChange).toHaveBeenCalledWith([new Date('08.10.2024'), new Date('09.10.2024')]);
        });

        it('should not call onChange when user pick up the same date as from and to', async () => {
            render(<DatePickerComponent {...mockProps} />);

            await userEvent.click(screen.getByRole('button', { name: 'from 08.10.2024 to 08.10.2024' }));

            expect(mockProps.onChange).not.toHaveBeenCalled();
        });
    });

    it('should call useReactDataPickerFocus', () => {
        render(<DatePickerComponent {...mockProps} />);

        expect(useReactDataPickerFocus).toHaveBeenCalled();
    });
});

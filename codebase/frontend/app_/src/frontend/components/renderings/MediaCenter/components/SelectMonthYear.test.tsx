import { act, render, screen } from '@testing-library/react';

import { IPickerMonthYearState, SelectMonthYear } from './SelectMonthYear';

let capturedOnChangeFromReactSelect: (option: { label: string; value: number }) => void;

jest.mock('react-select', () => (props: any) => {
    capturedOnChangeFromReactSelect = props.onChange;

    return (
        <div data-tid='mock-react-select' onClick={props.onMenuOpen}>
            <span>Current Value: {props.value?.label}</span>
        </div>
    );
});

jest.mock('frontend/components/common/Select/DropdownIndicator/DropdownIndicator', () => () => (
    <div data-tid='mock-dropdown-indicator' />
));
jest.mock('frontend/components/common/Select/MenuList', () => (props: any) => (
    <div data-tid='mock-menu-list'>{props.children}</div>
));
jest.mock('frontend/components/common/Select/Option', () => (props: any) => (
    <div data-tid='mock-option'>{props.children}</div>
));

describe('<SelectMonthYear />', () => {
    const resetMocks = () =>
        ({
            value: new Date(2020, 10, 11),
            minDate: new Date(2020, 0, 1),
            maxDate: new Date(),
            hasOverlay: true,
            className: '',
            classNamePrefix: '',
            calendarRef: {
                current: {
                    flatpickr: {
                        config: {
                            onMonthChange: {
                                push: jest.fn(),
                            },
                        },
                        set: jest.fn(),
                        jumpToDate: jest.fn(),
                    },
                },
            },
            initialPickerState: {
                month: 4,
                year: 2020,
            } as IPickerMonthYearState,
            getPhrase: jest.fn(),
        } as any);

    let props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
    });

    it('should render the mocked Select component', () => {
        render(<SelectMonthYear {...props} />);

        expect(screen.getByTestId('mock-react-select')).toBeInTheDocument();
        expect(props.calendarRef.current?.flatpickr.config.onMonthChange.push).toHaveBeenCalledTimes(1);
    });

    it('should call flatpickr.jumpToDate when the Select onChange is triggered', () => {
        if (props.calendarRef.current?.flatpickr) {
            props.calendarRef.current.flatpickr.currentYear = props.initialPickerState.year;
            props.calendarRef.current.flatpickr.currentMonth = props.initialPickerState.month;
        }

        render(<SelectMonthYear {...props} />);

        expect(capturedOnChangeFromReactSelect).toBeDefined();
        expect(capturedOnChangeFromReactSelect).toBeInstanceOf(Function);

        const selectedOption = { value: 1, label: 'June 2020' };

        act(() => {
            capturedOnChangeFromReactSelect(selectedOption);
        });

        expect(props.calendarRef.current?.flatpickr.jumpToDate).toHaveBeenCalledTimes(1);

        const expectedDate = new Date(
            props.initialPickerState.year,
            props.initialPickerState.month + selectedOption.value,
            1,
        );
        expect(props.calendarRef.current?.flatpickr.jumpToDate).toHaveBeenCalledWith(expectedDate, true);
    });

    it('should update currentPickerState when flatpickr onMonthChange is called', () => {
        render(<SelectMonthYear {...props} />);

        const onMonthChangeCallback = props.calendarRef.current?.flatpickr.config.onMonthChange.push.mock.calls[0][0];
        expect(onMonthChangeCallback).toBeInstanceOf(Function);

        const flatpickrInstanceArg = {
            currentMonth: 7,
            currentYear: 2020,
        };

        act(() => {
            onMonthChangeCallback(null, null, flatpickrInstanceArg);
        });

        expect(screen.getByText('Current Value: August 2020')).toBeInTheDocument();
    });
});

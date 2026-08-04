import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import CalendarFilterDesktop, { ICalendarFilterDesktopProps } from './CalendarFilterDesktop';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFlatPickerProps = jest.fn();
jest.mock('frontend/components/common/Calendar/components/FlatPickerDynamic', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/components/common/Calendar/components/FlatPickerDynamic'),
    DynamicFlatPicker: props => {
        mockFlatPickerProps(props);

        return <div data-tid='flat-picker-dynamic'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/common/FakeInput/FakeInput', () => ({ onClick, value, placeholder }) => (
    <>
        <input data-tid='fake-input' onClick={onClick} value={value} />
        <span data-tid='fake-input-placeholder'>{placeholder}</span>
    </>
));

const resetMocks = (): ICalendarFilterDesktopProps => ({
    id: 'test_id',
    label: 'label',
    placeholder: 'placeholder',
    value: new Date(),
    minDate: new Date(2020, 0, 1),
    maxDate: new Date(),
    onChange: jest.fn(),
});

let mocks;

describe('<CalendarFilterDesktop />', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2023, 11, 12));
    });

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('should render CalendarFilterDesktop', () => {
        render(<CalendarFilterDesktop {...mocks} />);

        expect(screen.getByTestId('flat-picker-dynamic')).toBeInTheDocument();
        expect(mockFlatPickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                calendarRef: { current: undefined },
                value: new Date('2023-12-12T00:00:00.000Z'),
                options: {
                    altInput: true,
                    altFormat: 'd.m.Y',
                    wrap: true,
                    disableMobile: true,
                    ignoredFocusElements: [],
                    maxDate: new Date('2023-12-12T00:00:00.000Z'),
                    minDate: new Date('2020-01-01T00:00:00.000Z'),
                },
                onChange: expect.any(Function),
                onReady: expect.any(Function),
                onOpen: expect.any(Function),
                onClose: expect.any(Function),
            }),
        );
        expect(screen.getByTestId('fake-input')).toBeInTheDocument();
        expect(screen.getByTestId('fake-input-placeholder')).toHaveTextContent('placeholder');
        expect(screen.getByTestId('fake-input')).toHaveValue('Tue Dec 12 2023');
    });
});

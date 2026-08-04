import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IMonthHeaderProps } from 'models/data/IDataPicker';

export const monthHeaderProps: IMonthHeaderProps = {
    monthDate: new Date('2024-10-01'),
    customHeaderCount: 0,
    decreaseMonth: jest.fn(),
    increaseMonth: jest.fn(),
    changeYear: jest.fn(),
    changeMonth: jest.fn(),
    prevMonthButtonDisabled: true,
    nextMonthButtonDisabled: false,
    onChangeShownDates: jest.fn(),
    minDate: new Date('2024-10-08'),
    maxDate: new Date('2025-10-08'),
    changeMonthButtonLabel: mockSitecoreField('Change month'),
    isOneMonthView: false,
    date: new Date('2024-10-01'),
    decreaseYear: jest.fn(),
    increaseYear: jest.fn(),
    prevYearButtonDisabled: false,
    nextYearButtonDisabled: false,
    excludedDates: [],
    onChange: jest.fn(),
    selectedDates: [undefined, undefined],
    IsCROVariant: undefined,
};

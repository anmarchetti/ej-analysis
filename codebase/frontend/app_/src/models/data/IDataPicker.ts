import { ReactDatePickerCustomHeaderProps } from 'react-datepicker/dist/calendar';
import { Dayjs } from 'dayjs';

import { TDatePickerAnswer } from 'models/data/IHolidayInspiration';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

export interface IDatePickerComponentProps {
    changeMonthButtonLabel: ISitecoreField<string>;
    excludedDates: Date[];
    maxDate: Date;
    minDate: Date;
    onChange: (dates: TDatePickerAnswer) => void;
    onChangeShownDates: (firstDate: Dayjs, secondDate?: Dayjs) => Promise<void>;
    selectedDates: TDatePickerAnswer;
    IsCROVariant?: TSitecoreCheckboxValue;
    isLoading?: boolean;
}

export interface IMonthHeaderProps extends ReactDatePickerCustomHeaderProps, IDatePickerComponentProps {
    isOneMonthView: boolean;
}

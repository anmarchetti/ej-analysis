import { IAvailableDate } from 'models/data/IAvailableDate';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import {
    TReactFlatpickr,
    TReactFlatpickrInstance,
} from 'frontend/components/common/Calendar/components/FlatPickerDynamic';

export interface IBaseWhenFieldProps extends IComponentWithDictionary {
    activeViewDate: Date;
    availableDates: Nullable<IAvailableDate[]>;
    clearDate: (noJump?: boolean) => void;
    debouncedChangeDateAvailabilityInterval: (start: Date, end: Date) => void;
    earliestDateField: null | Date;
    flexDays: number;

    focusCalendar: () => void;
    isDateAvailable: (date: Date, checkFlex?: boolean) => boolean;

    isFlexible: boolean;
    isOneMonthPromoPage: boolean;
    isPromoPage: boolean;

    lastAvailableDate: Nullable<Date>;
    maxDate: Date;

    minDate: Date;

    nightsNum: number;
    nightsSelectedLabel: Nullable<string>;
    onApply: () => void;
    onChangeDates: (dates: Date[]) => void;
    onCloseClick: () => void;
    onDayCreate: (dObj, dStr, fp, dayElem) => void;
    oneMonthPromoPageFlow: (dates: Date[], instance, refScrollableContainer?) => void;
    promoMaxDate: Nullable<Date>;
    promoMinDate: Nullable<Date>;

    refFpCalendar: React.RefObject<TReactFlatpickr>;

    renderError: () => JSX.Element | null;

    setActiveDate: (date: Date) => void;
    setFlatPikrDateValue: (dates: Date[], noJump?: boolean) => void;
    setMaxDate: (date: Date) => void;

    showEmptyMonths: (instance: TReactFlatpickrInstance) => void;
    value: Date[];

    applyBtnText?: string;
    firstAvailableDepartureDate?: Date;
    ignoreIsPromoPage?: boolean;
    isApplyDisabled?: boolean;
}

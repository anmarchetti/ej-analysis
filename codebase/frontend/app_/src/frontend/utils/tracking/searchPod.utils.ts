import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';

export const isWhenFieldPrePopulated = (
    prefilledSearch: IPrefilledSearchParams | null,
    fromDate: Date | null,
    selectedNumberOfNights: number,
    flexDays: number | undefined,
    isMonthSearch: boolean,
): boolean => {
    if (!prefilledSearch || !fromDate || !prefilledSearch.durations?.length) {
        return false;
    }

    const formattedFromDate = formatDateL10n(fromDate, DATE_FORMATS.default);
    const prefilledDuration = Number(prefilledSearch.durations[0]);

    return (
        formattedFromDate === prefilledSearch.startDate &&
        selectedNumberOfNights === prefilledDuration &&
        Number(flexDays) === Number(prefilledSearch.flexDays) &&
        prefilledSearch.isMonthSearch === isMonthSearch
    );
};

export const buildTrackingValue = (isPrePopulated: boolean, value: string, prefilledValuePlaceholder: string): string =>
    isPrePopulated ? `${value} ${prefilledValuePlaceholder}` : value;

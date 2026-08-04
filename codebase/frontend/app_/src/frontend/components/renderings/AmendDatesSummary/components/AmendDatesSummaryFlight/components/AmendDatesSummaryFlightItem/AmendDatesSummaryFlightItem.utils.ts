import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IRoute } from 'models/data/IRoute';

export const getFormattedDate = (
    route: IRoute,
): {
    arrivalTime: string;
    date: string;
    departureTime: string;
} => ({
    date: formatDateL10n(route.depDate, 'dddd D MMMM YYYY'),
    arrivalTime: formatDateL10n(route.arrDate, DATE_FORMATS.time),
    departureTime: formatDateL10n(route.depDate, DATE_FORMATS.time),
});

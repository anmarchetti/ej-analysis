import dayjs from 'dayjs';
import flatpickr from 'flatpickr';
import { english } from 'flatpickr/dist/l10n/default';
import { French } from 'flatpickr/dist/l10n/fr';

import { localizeDayJS, localizeFlatpickr } from './l10n.utils';

jest.mock('flatpickr', () => ({
    __esModule: true,
    default: {
        l10ns: {},
        localize: jest.fn(),
    },
}));

jest.mock('dayjs', () => ({
    __esModule: true,
    default: {
        Ls: {},
        extend: jest.fn(),
        locale: jest.fn(locale => locale),
        updateLocale: jest.fn(),
    },
}));

describe('l10n.utils', () => {
    describe('localizeFlatpickr', () => {
        it('should call flatpicket localize with default locale when no config for provided lang', () => {
            localizeFlatpickr('test');

            expect(flatpickr.localize).toBeCalledWith(english);
        });

        it('should setup locale for provided lang', () => {
            localizeFlatpickr('fr');

            expect(flatpickr.localize).toBeCalledWith(French);
        });
    });

    describe('localizeDayJS', () => {
        it('should call dayJS localize with default locale when no config for provided lang', () => {
            const res = localizeDayJS('test');

            expect(dayjs.locale).toBeCalledWith('en-gb');
            expect(dayjs.updateLocale).toBeCalledTimes(1);
            expect(res).toBe('en-gb');
        });

        it('should setup locale for provided lang', () => {
            const res = localizeDayJS('fr');

            expect(dayjs.locale).toBeCalledWith('fr');
            expect(dayjs.updateLocale).toBeCalledTimes(1);
            expect(res).toBe('fr');
        });
    });
});

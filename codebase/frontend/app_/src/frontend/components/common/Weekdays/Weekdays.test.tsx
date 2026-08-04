import React from 'react';
import { render } from '@testing-library/react';

import Weekdays from './Weekdays';
import { WeekDayFormat } from './weekdays.utils';

jest.mock('code/dates', () => ({
    MONDAY: 1,
}));

jest.mock('dayjs', () => ({
    weekdaysMin: () => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    weekdaysShort: () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekdays: () => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}));

describe('<Weekdays />', () => {
    it('should render min weekdays starting from Monday by default', () => {
        const { container } = render(<Weekdays />);
        const days = container.querySelectorAll('span');

        expect(days[0]).toHaveTextContent(/^Mo$/);
        expect(days[1]).toHaveTextContent(/^Tu$/);
        expect(days[2]).toHaveTextContent(/^We$/);
        expect(days[3]).toHaveTextContent(/^Th$/);
        expect(days[4]).toHaveTextContent(/^Fr$/);
        expect(days[5]).toHaveTextContent(/^Sa$/);
        expect(days[6]).toHaveTextContent(/^Su$/);
    });

    it('should render short weekdays', () => {
        const { container } = render(<Weekdays format={WeekDayFormat.Short} />);
        const days = container.querySelectorAll('span');

        expect(days[0]).toHaveTextContent(/^Mon$/);
        expect(days[1]).toHaveTextContent(/^Tue$/);
        expect(days[2]).toHaveTextContent(/^Wed$/);
        expect(days[3]).toHaveTextContent(/^Thu$/);
        expect(days[4]).toHaveTextContent(/^Fri$/);
        expect(days[5]).toHaveTextContent(/^Sat$/);
        expect(days[6]).toHaveTextContent(/^Sun$/);
    });

    it('should render full weekdays', () => {
        const { container } = render(<Weekdays format={WeekDayFormat.Full} />);
        const days = container.querySelectorAll('span');

        expect(days[0]).toHaveTextContent(/^Monday$/);
        expect(days[1]).toHaveTextContent(/^Tuesday$/);
        expect(days[2]).toHaveTextContent(/^Wednesday$/);
        expect(days[3]).toHaveTextContent(/^Thursday$/);
        expect(days[4]).toHaveTextContent(/^Friday$/);
        expect(days[5]).toHaveTextContent(/^Saturday$/);
        expect(days[6]).toHaveTextContent(/^Sunday$/);
    });

    it('should render weekdays starting from Sunday when weekStart is 0', () => {
        const { container } = render(<Weekdays format={WeekDayFormat.Full} weekStart={0} />);

        const days = container.querySelectorAll('span');
        expect(days[0]).toHaveTextContent(/^Sunday$/);
        expect(days[1]).toHaveTextContent(/^Monday$/);
        expect(days[2]).toHaveTextContent(/^Tuesday$/);
        expect(days[3]).toHaveTextContent(/^Wednesday$/);
        expect(days[4]).toHaveTextContent(/^Thursday$/);
        expect(days[5]).toHaveTextContent(/^Friday$/);
        expect(days[6]).toHaveTextContent(/^Saturday$/);
    });

    it('should render custom class', () => {
        const { container } = render(<Weekdays className='custom-class' />);

        expect(container.firstChild).toHaveClass('custom-class');
    });
});

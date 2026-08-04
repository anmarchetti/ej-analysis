import { focusDateForAccessibility } from './WhenFieldDesktop.utils';

jest.useFakeTimers();

describe('focusDateForAccessibility', () => {
    it('should focus the correct day element based on date', () => {
        const mockFocus = jest.fn();

        const targetDate = new Date('2024-03-15');

        const mockDayElem = document.createElement('button');
        mockDayElem.className = 'flatpickr-day';
        (mockDayElem as any).dateObj = new Date('2024-03-15');
        mockDayElem.focus = mockFocus;

        const otherDayElem = document.createElement('button');
        otherDayElem.className = 'flatpickr-day';
        (otherDayElem as any).dateObj = new Date('2024-03-10');
        otherDayElem.focus = jest.fn();

        const calendarContainer = document.createElement('div');
        calendarContainer.appendChild(mockDayElem);
        calendarContainer.appendChild(otherDayElem);

        jest.spyOn(calendarContainer, 'querySelectorAll').mockReturnValue([
            mockDayElem,
            otherDayElem,
        ] as unknown as NodeListOf<Element>);

        focusDateForAccessibility([targetDate], { calendarContainer });

        jest.runAllTimers();

        expect(mockFocus).toHaveBeenCalledTimes(1);
    });
});

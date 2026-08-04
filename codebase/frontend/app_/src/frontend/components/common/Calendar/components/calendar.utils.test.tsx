import { makeOverlayOnDisabledMonths, unavailabilityOverlay, unavailableMonthOverlay } from './calendar.utils';

class MockFlatpickr {
    rContainer: any;
    weekdayContainer: any;
    constructor() {
        this.rContainer = {
            querySelectorAll: jest.fn(() => [new MockDayContainer()]),
        };
    }
}

class MockDayContainer {
    getElementsByClassName: any;
    constructor() {
        this.getElementsByClassName = jest.fn(() => [new MockDay()]);
    }

    prepend = jest.fn();
}

class MockDay {
    classList: any;
    constructor() {
        this.classList = {
            contains: jest.fn(() => false),
        };
    }
}

const mockGetSettingFunc = jest.fn();

describe('calendar.utils', () => {
    describe('unavailableMonthOverlay', () => {
        let mockInstance;

        beforeEach(() => {
            mockInstance = new MockFlatpickr();
        });

        it('does nothing when there are no elements with dayContainer class', () => {
            mockInstance.rContainer.querySelectorAll = jest.fn(() => []);

            unavailableMonthOverlay(mockInstance, mockGetSettingFunc);

            expect(mockGetSettingFunc).not.toHaveBeenCalled();
        });

        it('does nothing when there are available days', () => {
            const calendarElement = document.createElement('div');
            calendarElement.appendChild = jest.fn();

            const dayElement = document.createElement('div');
            calendarElement.querySelectorAll = jest.fn(() => [dayElement]) as any;
            mockInstance.rContainer.querySelectorAll = jest.fn(() => [calendarElement]);

            unavailableMonthOverlay(mockInstance, mockGetSettingFunc);

            expect(mockGetSettingFunc).not.toHaveBeenCalled();
        });

        it('should create an overlay when there are no available days', () => {
            const calendarElement = document.createElement('div');
            calendarElement.appendChild = jest.fn();

            mockInstance.rContainer.querySelectorAll = jest.fn(() => [calendarElement]);

            unavailableMonthOverlay(mockInstance, mockGetSettingFunc);

            expect(calendarElement.appendChild).toHaveBeenCalled();
        });
    });

    describe('unavailabilityOverlay', () => {
        it('should return image and text', () => {
            const result = unavailabilityOverlay('image', 'content');

            expect(result.className).toBe('month-unavailable');
            expect(result.querySelector('img')!.getAttribute('src')).toBe('image');
            expect(result.querySelector('p')!.innerHTML).toBe('content');
        });
    });

    describe('makeOverlayOnDisabledMonths', () => {
        let refFpCalendar;
        let overlayDisabledMonths;

        beforeEach(() => {
            overlayDisabledMonths = true;
            refFpCalendar = {
                current: {
                    flatpickr: new MockFlatpickr(),
                },
            };
        });

        it('should not execute when overlayDisabledMonths is false', () => {
            overlayDisabledMonths = false;
            makeOverlayOnDisabledMonths(overlayDisabledMonths, refFpCalendar, mockGetSettingFunc);

            expect(refFpCalendar.current.flatpickr.rContainer.querySelectorAll).not.toHaveBeenCalled();
        });

        it('should create an overlay when there are no available days', () => {
            const calendarElement = document.createElement('div');
            calendarElement.appendChild = jest.fn();

            const dayElement = document.createElement('div');
            dayElement.classList.add('flatpickr-day', 'notAllowed');
            calendarElement.getElementsByClassName = jest.fn(() => [dayElement]) as any;

            refFpCalendar.current.flatpickr.rContainer.querySelectorAll = jest.fn(() => [calendarElement]);

            makeOverlayOnDisabledMonths(overlayDisabledMonths, refFpCalendar, mockGetSettingFunc);

            expect(calendarElement.appendChild).toHaveBeenCalled();
        });
    });
});

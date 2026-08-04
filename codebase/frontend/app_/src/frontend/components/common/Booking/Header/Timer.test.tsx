import { render, screen } from '@testing-library/react';

import { TimeUnitsDictionary } from 'models/enum/TimeUnitsDictionary';

import { Timer } from './Timer';

jest.mock('frontend/utils/date.utils', () => ({
    getDaysDifferenceRoundedFloor: jest.fn().mockReturnValue(1),
    getHoursDifference: jest.fn().mockReturnValue(2),
    getMinutesDifference: jest.fn().mockReturnValue(3),
    getSecondsDifference: jest.fn().mockReturnValue(4),
}));

describe('Timer', () => {
    const createProps = () => ({
        date: new Date('2020-09-03T14:00:00'),
        getPhrase: jest.fn(d => d),
        getTimeUnitLabel: jest.fn(),
        useAbbreviation: false,
    });

    let props;
    let setIntervalSpy: jest.SpyInstance;
    let clearIntervalSpy: jest.SpyInstance;

    beforeEach(() => {
        props = createProps();
        setIntervalSpy = jest.spyOn(window, 'setInterval');
        clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    });

    it('should call setInterval after mounting and run the timer callback', () => {
        render(<Timer {...props} />);

        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should call clearInterval after unmounting', () => {
        const { unmount } = render(<Timer {...props} />);

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should render correct string based on mocked date differences and getTimeUnitLabel', () => {
        props.getTimeUnitLabel.mockReturnValue('test_unit');

        render(<Timer {...props} />);

        expect(props.getTimeUnitLabel).toHaveBeenCalledWith(1, TimeUnitsDictionary.days, false);
        expect(props.getTimeUnitLabel).toHaveBeenCalledWith(2, TimeUnitsDictionary.hours, false);
        expect(props.getTimeUnitLabel).toHaveBeenCalledWith(3, TimeUnitsDictionary.minutes, false);
        expect(props.getTimeUnitLabel).toHaveBeenCalledWith(4, TimeUnitsDictionary.seconds, false);

        const expectedTextRegex = /BookingHeader.Labels.In 1\s+test_unit, 2\s+test_unit, 3\s+test_unit, 4\s+test_unit/;
        expect(screen.getByText(expectedTextRegex)).toBeInTheDocument();
    });
});

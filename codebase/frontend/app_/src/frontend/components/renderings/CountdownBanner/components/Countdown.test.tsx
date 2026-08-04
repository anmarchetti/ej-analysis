import React from 'react';
import { render, screen } from '@testing-library/react';

import { ICountdownTime } from 'models/data/ICountdownBaner';

import Countdown from './Countdown';

describe('<Countdown />', () => {
    const resetMocks = () => ({
        time: [
            {
                value: 1,
                label: 'label1',
            },
            {
                value: 2,
                label: 'label2',
            },
        ],
    });

    let props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
    });

    const formatValue = (val: number) => (val < 10 ? `0${val}` : String(val));

    it('should render the countdown container and the correct number of digit sections', () => {
        render(<Countdown {...props} />);

        expect(screen.getByTestId('countdown')).toBeInTheDocument();

        props.time.forEach(item => {
            expect(screen.getByText(formatValue(item.value))).toBeInTheDocument();
            expect(screen.getByText(item.label)).toBeInTheDocument();
        });

        const labels = props.time.map(item => screen.getByText(item.label));
        expect(labels).toHaveLength(props.time.length);
    });

    it('should render the countdown container but no digit sections when time array is empty', () => {
        const { container } = render(<Countdown time={[]} />);

        expect(screen.getByTestId('countdown')).toBeInTheDocument();

        props.time.forEach(item => {
            expect(screen.queryByText(formatValue(item.value))).not.toBeInTheDocument();
            expect(screen.queryByText(item.label)).not.toBeInTheDocument();
        });

        expect(container.querySelectorAll('.countdown__digit').length).toBe(0);
    });

    it('should add a "0" prefix to numbers less than 10', () => {
        const timeProps: ICountdownTime[] = [{ value: 7, label: 'Days' }];
        render(<Countdown time={timeProps} />);

        expect(screen.getByText('07')).toBeInTheDocument();
        expect(screen.getByText('Days')).toBeInTheDocument();
    });

    it('should NOT add a "0" prefix to numbers greater than or equal to 10', () => {
        const timeProps: ICountdownTime[] = [{ value: 15, label: 'Hours' }];

        render(<Countdown time={timeProps} />);

        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('Hours')).toBeInTheDocument();
    });

    it('should apply the className prop to the number divs', () => {
        const customClassName = 'my-custom-style';
        const timeProps: ICountdownTime[] = [{ value: 5, label: 'Minutes' }];

        const { container } = render(<Countdown time={timeProps} className={customClassName} />);

        const numberDivs = container.querySelectorAll('.number');
        expect(numberDivs.length).toBe(1);
        expect(numberDivs[0]).toHaveClass('number');
        expect(numberDivs[0]).toHaveClass(customClassName);
    });
});

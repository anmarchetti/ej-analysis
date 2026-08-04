import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import FlatPicker, { IFlatPickerProps } from './FlatPicker';

expect.extend(toHaveNoViolations);

let mockProps: IFlatPickerProps;

const mockReactFlatPickerProps = jest.fn();
jest.mock('react-flatpickr', () => ({
    __esModule: true,
    default: props => {
        mockReactFlatPickerProps(props);

        return <div data-tid='react-flatpickr' />;
    },
}));

describe('<FlatPicker />', () => {
    beforeEach(() => {
        mockProps = {
            calendarRef: React.createRef(),
            withOpenedCalendar: true,
            value: 'CalendarValue',
        };
    });

    it('Should render component', () => {
        const { container } = render(<FlatPicker {...mockProps} />);

        expect(screen.getByTestId('react-flatpickr')).toBeInTheDocument();
        expect(container.querySelector('.datePicker')).toBeInTheDocument();
        expect(mockReactFlatPickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                value: 'CalendarValue',
                options: expect.objectContaining({
                    locale: expect.objectContaining({
                        firstDayOfWeek: 1,
                    }),
                }),
            }),
        );
    });

    it('Should set firstDayOfWeek in options', () => {
        render(<FlatPicker {...mockProps} options={{ locale: { firstDayOfWeek: 0 } }} />);

        expect(mockReactFlatPickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                options: expect.objectContaining({
                    locale: expect.objectContaining({
                        firstDayOfWeek: 0,
                    }),
                }),
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<FlatPicker />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});

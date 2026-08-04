import { render, screen } from '@testing-library/react';

import FlightErrata from 'frontend/components/common/ErrataInfo/FlightErrata';

jest.mock('frontend/components/icons/InfoCircle', () => () => <svg data-tid='icon-info-circle' />);

const createProps = () => ({
    errataFlightInfo: [],
    dotcomRouter: false,
});

let props;

describe('FlightErrata', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render FlightErrata with messages if errataFlightInfo is not empty', () => {
        props.errataFlightInfo = ['First errata', 'Second <b>errata</b>'];

        render(<FlightErrata {...props} />);

        expect(screen.getByTestId('flight-errata')).toBeInTheDocument();

        const errataMessages = screen.getAllByTestId('flight-errata-message');

        expect(errataMessages).toHaveLength(2);
        expect(errataMessages[0]).toHaveTextContent('First errata');
        expect(errataMessages[1]).toHaveTextContent('Second errata');
        expect(errataMessages[1].innerHTML).toBe('Second <b>errata</b>');
    });

    it('should NOT render FlightErrata if errataFlightInfo is an empty array', () => {
        props.errataFlightInfo = [];
        const { container } = render(<FlightErrata {...props} />);

        expect(screen.queryByTestId('flight-errata')).not.toBeInTheDocument();
        expect(container.firstChild).toBeNull();
    });

    it('should NOT render FlightErrata if errataFlightInfo is undefined', () => {
        const { container } = render(<FlightErrata {...props} />);

        expect(screen.queryByTestId('flight-errata')).not.toBeInTheDocument();
        expect(container.firstChild).toBeNull();
    });

    describe('Styling and Icon', () => {
        it('should not have dot style and show icon when dotListStyle is false (or undefined)', () => {
            props.errataFlightInfo = ['An errata message'];

            render(<FlightErrata {...props} />);

            const listElement = screen.getByRole('list');
            expect(listElement).not.toHaveClass('flight-errata__items--dot');

            expect(screen.getByTestId('icon-info-circle')).toBeInTheDocument();
        });

        it('should have dot style and hide icon when dotListStyle is true', () => {
            props.errataFlightInfo = ['An errata message'];
            props.dotListStyle = true;

            render(<FlightErrata {...props} />);

            const listElement = screen.getByRole('list');
            expect(listElement).toHaveClass('flight-errata__items--dot');

            expect(screen.queryByTestId('icon-info-circle')).not.toBeInTheDocument();
        });

        it('should render multiple errata items correctly with icons when not dotListStyle', () => {
            const errataMessages = ['Msg 1', 'Msg 2'];
            props.errataFlightInfo = errataMessages;

            render(<FlightErrata {...props} />);

            const renderedMessages = screen.getAllByTestId('flight-errata-message');
            expect(renderedMessages).toHaveLength(errataMessages.length);

            const icons = screen.getAllByTestId('icon-info-circle');
            expect(icons).toHaveLength(errataMessages.length);

            renderedMessages.forEach((msgEl, index) => {
                expect(msgEl).toHaveTextContent(errataMessages[index]);
            });
        });
    });
});

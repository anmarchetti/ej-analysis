import * as React from 'react';
import { render, screen } from '@testing-library/react';

import RoomCardInfo, { IRoomCardInfoProps } from './RoomCardInfo';

const createProps = (): IRoomCardInfoProps => ({
    isScreenMedium: false,
    isAlterationInfoVisible: false,
    alterationInfoTitle: 'alteration title',
    alterationInfoText: 'alteration text',
    isAlterationExtendedInfoVisible: false,
    alterationExtendedInfoTitle: 'alteration ext title',
    alterationExtendedInfoText: 'alteration ext text',
    isKidsInfoVisible: false,
    kidsInfoTitle: 'child place title',
    kidsInfoText: 'child place text',
});

let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<RoomCardInfo />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should render empty DOM when no alteration info or alteration extended info or child info', () => {
        const { container } = render(<RoomCardInfo {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render only alteration info alert', () => {
        props.isAlterationInfoVisible = true;

        render(<RoomCardInfo {...props} />);

        expect(screen.getAllByRole('alert')).toHaveLength(1);
        expect(screen.getByText(props.alterationInfoTitle)).toBeInTheDocument();
        expect(screen.getByText(props.alterationInfoText)).toBeInTheDocument();
    });

    it('Should render only kids info alert', () => {
        props.isKidsInfoVisible = true;

        render(<RoomCardInfo {...props} />);

        expect(screen.getAllByRole('alert')).toHaveLength(1);
        expect(screen.getByText(props.kidsInfoTitle)).toBeInTheDocument();
        expect(screen.getByText(props.kidsInfoText)).toBeInTheDocument();
    });

    it('Should render only alteration extended alert', () => {
        props.isAlterationExtendedInfoVisible = true;

        render(<RoomCardInfo {...props} />);

        expect(screen.getAllByRole('alert')).toHaveLength(1);
        expect(screen.getByText(props.alterationExtendedInfoTitle)).toBeInTheDocument();
        expect(screen.getByText(props.alterationExtendedInfoText)).toBeInTheDocument();
    });
});

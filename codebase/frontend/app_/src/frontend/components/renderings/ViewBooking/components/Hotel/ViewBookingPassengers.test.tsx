import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { GenderType } from 'models/enum/GenderType';
import SiteSettings from 'models/enum/SiteSettings';

import ViewBookingPassengers, { TViewBookingPassengersProps } from './ViewBookingPassengers';

const createProps = (): TViewBookingPassengersProps => ({
    adultsCount: 0,
    adultsCountLabel: 'adultsCountLabel',
    childrenCount: 0,
    childrenCountLabel: 'childrenCountLabel',
    infantsCount: 0,
    infantsCountLabel: 'infantsCountLabel',
    mainGuestSex: GenderType.Female,
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ViewBookingPassengers />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should be empty when no guests', () => {
        const { container } = render(<ViewBookingPassengers {...props} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render adults label and count when only one man', () => {
        props.mainGuestSex = GenderType.Male;
        props.adultsCount = 1;
        render(<ViewBookingPassengers {...props} />);

        expect(screen.getByTestId('adults-label')).toBeInTheDocument();
        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.MaleIcon);

        expect(screen.queryByTestId('children-label')).not.toBeInTheDocument();
        expect(screen.queryByTestId('infants-label')).not.toBeInTheDocument();
    });

    it('should render adults label and count when only one women', () => {
        props.adultsCount = 1;
        render(<ViewBookingPassengers {...props} />);

        expect(screen.getByTestId('adults-label')).toBeInTheDocument();
        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.FemaleIcon);

        expect(screen.queryByTestId('children-label')).not.toBeInTheDocument();
        expect(screen.queryByTestId('infants-label')).not.toBeInTheDocument();
    });

    it('should render adults label and count when guests contain more than one adult', () => {
        props.adultsCount = 2;
        render(<ViewBookingPassengers {...props} />);

        expect(screen.getByTestId('adults-label')).toBeInTheDocument();
        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.AdultsIcon);

        expect(screen.queryByTestId('children-label')).not.toBeInTheDocument();
        expect(screen.queryByTestId('infants-label')).not.toBeInTheDocument();
    });

    it('should render children label and count when guests contain one child', () => {
        props.childrenCount = 1;

        render(<ViewBookingPassengers {...props} />);

        expect(screen.queryByTestId('adults-label')).not.toBeInTheDocument();
        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.ChildIcon);
        expect(screen.getByTestId('children-label')).toBeInTheDocument();
        expect(screen.queryByTestId('infants-label')).not.toBeInTheDocument();
    });

    it('should render children label and count when guests contain more than one child', () => {
        props.childrenCount = 2;

        render(<ViewBookingPassengers {...props} />);

        expect(screen.queryByTestId('adults-label')).not.toBeInTheDocument();
        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.ChildrenIcon);
        expect(screen.getByTestId('children-label')).toBeInTheDocument();
        expect(screen.queryByTestId('infants-label')).not.toBeInTheDocument();
    });

    it('should render infant label and count when guests contain at least one infant', () => {
        props.infantsCount = 1;

        render(<ViewBookingPassengers {...props} />);

        expect(screen.queryByTestId('adults-label')).not.toBeInTheDocument();
        expect(screen.queryByTestId('children-label')).not.toBeInTheDocument();
        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.InfantIcon);

        expect(screen.getByTestId('infants-label')).toBeInTheDocument();
    });

    it('should render infant label and count when guests contain more than one infant', () => {
        props.infantsCount = 2;

        render(<ViewBookingPassengers {...props} />);

        expect(screen.queryByTestId('adults-label')).not.toBeInTheDocument();
        expect(screen.queryByTestId('children-label')).not.toBeInTheDocument();
        expect(mockStores.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.InfantsIcon);

        expect(screen.getByTestId('infants-label')).toBeInTheDocument();
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import GuestDetailsSkeleton from './GuestDetailsSkeleton';

const mockGuestDetailsHeaderComponent = jest.fn();
jest.mock('./section/GuestDetailsHeader', () => ({
    __esModule: true,
    default: props => {
        mockGuestDetailsHeaderComponent(props);

        return <header data-tid='guest-details-header' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockStores = createMockStores();

describe('<GuestDetailsSkeleton />', () => {
    it('should render correctly', () => {
        const { container } = render(<GuestDetailsSkeleton />);

        expect(mockGuestDetailsHeaderComponent).toHaveBeenCalledWith({
            icon: expect.any(Object),
            isExpanded: true,
            secondaryText: '(GuestDetails.SectionHeaders.LeadGuest)',
            title: 'GuestDetails.SectionHeaders.Adult 1',
        });
        expect(screen.getByTestId('guest-details-header')).toBeInTheDocument();
        expect(container.querySelectorAll('.placeholder-shimmer')).toHaveLength(2);
    });
});

import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { IHotel, IRoomType } from 'models/data/IHotel';

import HotelInfo, { IHotelInfoProps } from './HotelInfo';

const SafeHotelInfo = (props: IHotelInfoProps) => (HotelInfo(props) as JSX.Element) || null;

const mockHotelData = {
    city: 'Test City',
    country: { name: 'Test Country' },
    resort: { name: 'Test Resort' },
    name: 'Test Hotel Name',
};

const createProps = (): IHotelInfoProps => ({
    hotel: mockHotelData as IHotel,
    rooms: [{ code: 'Test', title: 'Test Title', description: 'Test Description' }] as IRoomType[],
});

let mockProps = createProps();

jest.mock('frontend/components/icons-new/HotelBedFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-bed-icon'>Hotel Bed Icon</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<HotelInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render', () => {
        render(<SafeHotelInfo {...mockProps} />);

        expect(screen.getByTestId('hotel-bed-icon')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-name')).toHaveTextContent('Test Hotel Name');
        expect(screen.getByTestId('location')).toHaveTextContent('Test Resort, Test Country');
        expect(screen.getByTestId('room-title')).toHaveTextContent('Test Title');
        expect(screen.getByTestId('room-description')).toHaveTextContent('Test Description');
    });

    it('should not show location when isPrintPreview is true', () => {
        render(<SafeHotelInfo {...mockProps} isPrintPreview />);

        expect(screen.queryByTestId('location')).not.toBeInTheDocument();
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomType from './RoomType';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('frontend/components/icons-new/HotelBedFilled', () => () => <div data-tid='hotel-bed-icon' />);

const createProps = () => ({
    room: {
        code: 'DB01',
        roomType: {
            code: 'DB01',
            title: 'Double room',
        },
        board: 'HB',
        boardType: {
            code: 'HB',
            title: 'Half board',
            content: 'content',
            iconUrl: '/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
        },
        occupation: { adults: 2, children: 0, infants: 0 },
    },
    roomNumber: 1,
    roomTotal: 1,
});

let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: {
            getPhrase: jest.fn(p => p),
        },
    }),
}));

describe('<RoomType />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should render room normally', () => {
        render(<RoomType {...props} />);

        expect(screen.getByTestId('room-subtitle')).toHaveTextContent(props.room.roomType.title);
        expect(screen.getByTestId('room-text')).toHaveTextContent(SitecoreDictionary.BookingSummaryLabelsForPeople);
        expect(screen.getByTestId('room-index-subtitle')).toHaveTextContent('Room 1');
        expect(screen.getByTestId('hotel-icon')).toBeInTheDocument();
    });

    it('Should NOT render subtitle if no room type info', () => {
        props.room = {
            code: 'DB01',
            occupation: { adults: 1, children: 0, infants: 0 },
        };
        props.roomTotal = 1;

        render(<RoomType {...props} />);

        expect(screen.queryByTestId('room-subtitle')).not.toBeInTheDocument();
    });

    it('should render room index subtitle and room type subtitle', () => {
        props.roomTotal = 2;
        props.roomNumber = 1;
        props.room = {
            ...props.room,
            roomType: { title: 'Deluxe Double Room' }, // Ensure roomType is defined for this test
        };

        render(<RoomType {...props} />);

        expect(screen.getByTestId('room-index-subtitle')).toHaveTextContent(`Room ${props.roomNumber}`);
        expect(screen.getByTestId('room-subtitle')).toHaveTextContent(props.room.roomType.title);
    });

    it('should render correct text for one guest', () => {
        props.room = {
            code: 'DB01',
            occupation: { adults: 1, children: 0, infants: 0 },
        };
        render(<RoomType {...props} />);

        expect(screen.getByTestId('room-text')).toHaveTextContent(SitecoreDictionary.BookingSummaryLabelsForPerson);
    });

    it('should render the hotel bed icon', () => {
        render(<RoomType {...props} />);

        expect(screen.getByTestId('hotel-bed-icon')).toBeInTheDocument();
    });
});

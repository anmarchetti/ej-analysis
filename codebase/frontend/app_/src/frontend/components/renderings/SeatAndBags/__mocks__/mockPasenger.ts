import { mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { SeatType } from 'models/enum/SeatType';

export const mockPassenger: IFlightPassenger = {
    passengerId: '1',
    seat: {
        seatNumber: '5A',
        price: 8.49,
        priceBand: SeatType.Standard,
        products: [
            {
                id: '123',
                name: 'bag 1',
                icon: 'src',
            },
            {
                id: '345',
                name: 'bag 2',
                icon: 'src',
            },
        ],
    },
    type: 'ADULT',
    withInfant: false,
    age: 25,
    index: '1',
    isLead: false,
    notBornYet: false,
    sex: 'Male',
    dateOfBirth: '',
};

export const mockPersonDetailsProps = {
    personIcon: mockSitecoreImageField(
        '/holidays/cms/media/-/jssmedia/project/holidays/default/icons/iconadult.ashx?iar=0&hash=37342505072D3FDE8A7B3217F8FFBCCD',
    ),
    titleConstant: 'Adult 1',
    title: 'Adult',
};

export const mockPersonFields = {
    Icon: mockSitecoreImageField(
        '/holidays/cms/media/-/jssmedia/project/holidays/default/icons/iconadult.ashx?iar=0&hash=37342505072D3FDE8A7B3217F8FFBCCD',
    ),

    TitleConstant: 'Adult 1',
    Title: 'Adult',
};

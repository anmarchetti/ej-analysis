import { mockAmendDatesOffer, mockBooking, mockSelectedSeat } from 'frontend/__mocks__';
import { TRootStore } from 'frontend/store/IStores';

import { BaseAmendPaymentStore } from './BaseAmendPaymentStore';

const transferPayload = {
    bookingReference: '70118791',
    lastName: 'Fisher',
    date: '2023-05-20',
    billingInfo: {
        fullName: 'Vobla Fisher',
        address: 'Szumiacych traw',
        address2: '',
        city: 'Warszawa',
        postCode: 'AA11BB',
    },
    selectedFlight: {
        amendmentCharges: 47.85,
        routes: [
            {
                arrDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                arrLocation: 'Spain',
                arrName: 'Alicante',
                arrPt: 'ALC',
                avail: 8,
                bkgCls: 'Z',
                car: 'EZY',
                cycDate: '2023-06-24',
                depDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                depLocation: 'London',
                depName: 'London Luton',
                depPt: 'LTN',
                depTime: '0605',
                direction: 'outbound',
                fltNo: 'EZY2313',
                id: 'E4b48cb681ea3a672551aa2e851583f02',
                isExt: true,
                routeCd: 'ALCLTN6T',
            },
            {
                arrDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                arrLocation: 'Spain',
                arrName: 'Alicante',
                arrPt: 'ALC',
                arrTime: '0940',
                avail: 8,
                bkgCls: 'Z',
                car: 'EZY',
                cycDate: '2023-06-24',
                depDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                depLocation: 'London',
                depName: 'London Luton',
                depPt: 'LTN',
                depTime: '0605',
                direction: 'outbound',
                fltNo: 'EZY2313',
                id: 'E4b48cb681ea3a672551aa2e851583f02',
                isExt: true,
                routeCd: 'ALCLTN6T',
            },
        ],
    },
    selectedTransfer: {
        amendmentCharges: 47.85,
        transfer: {
            type: 'PRIVATE',
            iconUrl: '/-/jssmedia/465913cfa96442e889318cf4ef0427cb.ashx',
            content:
                "<ul>\n    <li>Get into holiday mode faster - less waiting when you upgrade to a private taxi transfer</li>\n    <li>You'll get a direct transfer to and from your hotel&nbsp;</li>\n</ul>",
            transferInfo: {
                arrivalInstr:
                    'Once you have collected your luggage, head towards the exit. Just before the automatic doors, to the right hand side, you will find the counter for the easyJet holidays team.  If you have any difficulty in locating your transfer please call our local partner on +34 606 551727 ',
                depInstr:
                    'When you’re going home we plan to collect you from your accommodation between 3 hours 05 minutes and 2 hours 35 minutes before your flight. Please ensure you are ready to go with all of your party and their luggage. The day before you are going home we’lln email your hotel reception to let them know your detailed pick-up information. If you have any problems with your transfer on the day of going home please contact our local partner on +34 606 551727 ',
                duration: 20,
            },
            code: 'JUMB010065PP',
            name: 'Private taxi',
            autoInclude: false,
            startDate: '2023-05-20T00:00:00',
            setType: 'EXTRA',
            typeCode: 'TF',
            prom: 'AUCI',
            quantity: 1,
            serviceStates: ['FIX', 'OPTION', 'QUOTE'],
            rateRule: 'DAY',
            method: 'PI',
            mcMethod: 'MANY',
            price: 60.64,
            minPax: 1,
            maxPax: 3,
            isHidden: false,
        },
    },
    selectedFlightFilters: [],
};

const deserializeAmendStore = (store: any, additionalData = {}) => {
    store.amendPaymentPayload = { amendPaymentPayload: transferPayload, ...additionalData };
};

let rootStore;

describe('BaseAmendPaymentStore', () => {
    let store;

    beforeEach(() => {
        const rootStore = {
            payStore: {
                amountToPay: 20,
                usedCredit: 30,
            },
            amendSeatsStore: {
                newSelection: undefined,
            },
        } as TRootStore;
        store = new BaseAmendPaymentStore(rootStore);
    });

    describe('isFromAmendSeats', () => {
        it('should return true for isFromAmendSeats', () => {
            deserializeAmendStore(store, { selectedSeats: [] });

            expect(store.isFromAmendSeats).toBeTruthy();
        });

        it('should return true for isFromAmendSeats when newSelection exists in amendSeatsStore', () => {
            store.rootStore.amendSeatsStore.newSelection = mockSelectedSeat;
            deserializeAmendStore(store);

            expect(store.isFromAmendSeats).toBeTruthy();
        });

        it('should return false for isFromAmendSeats', () => {
            deserializeAmendStore(store, { selectedSeats: undefined });

            expect(store.isFromAmendSeats).toBeFalsy();
        });
    });

    describe('isFromAmendDates', () => {
        it('should return true for isFromAmendDates if amendDates offer present in additional data during initialization', () => {
            deserializeAmendStore(store, { amendDatesOffer: mockAmendDatesOffer });

            expect(store.isFromAmendDates).toBeTruthy();
        });

        it('should return false for isFromAmendDates if amendDates offer NOT present in additional data during initializations', () => {
            deserializeAmendStore(store, { amendDatesOffer: undefined });

            expect(store.isFromAmendDates).toBeFalsy();
        });
    });

    it('balanceAmount', () => {
        const store = new BaseAmendPaymentStore(rootStore);

        store.booking = mockBooking;
        expect(store.balanceAmount).toBe(1);
    });
});

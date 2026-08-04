import { groupArrayByKey } from 'frontend/utils/array.utils';
import { IGuestsAmount } from 'frontend/utils/luggage.utils';
import { trimPhoneNumber } from 'frontend/utils/phoneNumber.utils';
import { IFlightPassenger, IPassengerFlights } from 'models/data/AncillariesInfo';
import { IGuestPassenger, ILeadPassenger } from 'models/data/ILeadPassenger';
import { ILoginInfo } from 'models/data/ILoginInfo';
import { IRoute } from 'models/data/IRoute';
import { IPassengerSeat, IPassengerSeats } from 'models/data/ISeatMapStore';
import { IGuest } from 'models/data/IValidPackageInfo';
import { AdultTitles } from 'models/enum/CustomerTitles';
import { GuestType } from 'models/enum/GuestType';
import { RouteDirection } from 'models/enum/RouteDirection';
import { GuestInfo } from 'models/GuestInfo';

export const getFullPassengerName = (
    passenger: IGuestPassenger | IFlightPassenger,
    getPhrase: (string) => string,
): string => {
    const fullName = `${passenger.firstName} ${passenger.lastName}`;

    if (GuestType.Adult === passenger.type) {
        const titleObj = AdultTitles.find(
            item => item.value.toLocaleLowerCase() === passenger.title?.toLocaleLowerCase(),
        );
        const title = getPhrase(titleObj?.label) || passenger.title;

        return `${title} ${fullName}`;
    }

    return fullName;
};

export const getLeadPassengerAddress = (passenger: ILeadPassenger): string =>
    passenger.address + (passenger.address2 ? `, ${passenger.address2}` : '');

export const groupPassengersByFlightRefs = (passengers: IGuest[], routes: IRoute[]): Map<string | null, IGuest[]> => {
    const passengersByFlights: Map<string | null, IGuest[]> = new Map();

    routes.forEach(route => {
        if (route.paxs?.length && route.direction === RouteDirection.Outbound) {
            route.paxs.forEach(pax => {
                const ref = pax.externalPNR || route.extRefId || null;
                const passenger = getPassengerByPaxIndex(pax.paxId, passengers);
                passenger && passengersByFlights.set(ref, (passengersByFlights.get(ref) || []).concat(passenger));
            });
        }
    });

    return passengersByFlights;
};

export const getPassengersByPaxIndexes = (paxIndexes: string[], passengers: IGuestPassenger[]): IGuest[] =>
    paxIndexes.reduce((resList, paxIndex) => {
        const guest = getPassengerByPaxIndex(paxIndex, passengers);
        !!guest && resList.push(guest);

        return resList;
    }, [] as IGuest[]);

export const getPassengerByPaxIndex = (paxIndex: string, passengers: IGuest[]): IGuest | undefined =>
    passengers.find(p => p.index === paxIndex);

export const convertGuestInfoToCustomerDetails = (
    guestInfo: GuestInfo,
    mailingsFlag: boolean,
    easyJetMailingsFlag: boolean,
): ILoginInfo =>
    ({
        title: guestInfo.title,
        email: guestInfo.email,
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        mobilePhone: trimPhoneNumber(guestInfo.phone, guestInfo.dialingCode),
        birthDate: '',
        address1: guestInfo.address,
        address2: guestInfo.address2,
        city: guestInfo.city,
        postalCode: guestInfo.postCode,
        dialingCode: guestInfo.dialingCode,
        countryCode: guestInfo.countryCode,
        mailingsFlag,
        easyJetMailingsFlag,
    } as ILoginInfo);

export const getGuestsAmount = (guests: IGuest[]): IGuestsAmount => {
    const groupedGuests = groupArrayByKey(guests, 'type');

    return {
        adults: groupedGuests[GuestType.Adult]?.length || 0,
        children: groupedGuests[GuestType.Child]?.length || 0,
        infants: groupedGuests[GuestType.Infant]?.length || 0,
    };
};

export const extractPassengerSeats = (passengersByQueue: IPassengerFlights[]): IPassengerSeats => {
    const { inboundSeats, outboundSeats } = passengersByQueue.reduce(
        (acc, item) => {
            if (item.inboundPassenger?.seat) {
                acc.inboundSeats.push(item.inboundPassenger.seat);
            }

            if (item.outboundPassenger?.seat) {
                acc.outboundSeats.push(item.outboundPassenger.seat);
            }

            return acc;
        },
        { inboundSeats: [] as IPassengerSeat[], outboundSeats: [] as IPassengerSeat[] },
    );

    return { inboundSeats, outboundSeats };
};

import { CurrencyCode } from 'code/currency';
import { IHotel, IRoom, ITheme, IThemeType } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';

export interface IHolidayDetails {
    adults: number;
    children: number;
    childrenAge: string;
    currencyCode: CurrencyCode;
    freeNightsIncluded: number;
    hasDistressedSeats: boolean;
    hotel: Nullable<IHotel>;
    id: string;
    inboundInfo: IRoute;
    infants: number;
    isExt: boolean;
    outboundInfo: IRoute;
    pricePP: number;
    prom: string;
    rooms: Array<IRoom | IUnit>;
    stay: number;
    theme: ITheme | undefined;
    totalPrice: number;
    type: IThemeType | undefined;
    accomId?: string;
    isSponsored?: boolean;
}

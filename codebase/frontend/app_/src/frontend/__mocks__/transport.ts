import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';

export const mockedTransport = {
    routes: [
        {
            id: 'Eaf170684b65f1e91ddcff8f737f8f07f',
            depPt: 'LGW',
            depDate: '2020-09-12T07:25:00+00:00',
            depName: 'London Gatwick',
            depItemName: 'London Gatwick',
            arrPt: 'TFS',
            arrDate: '2020-09-12T12:00:00+00:00',
            arrName: 'Tenerife Airport',
            arrItemName: 'Tenerife Airport',
            fltNo: 'flight-1',
            isExt: true,
            direction: RouteDirection.Outbound,
        },
        {
            id: 'Ea0e3d4ed50d28b03399b3308532cabc1',
            depPt: 'TFS',
            depDate: '2020-09-19T19:10:00+00:00',
            depName: 'Tenerife Airport',
            depItemName: 'Tenerife Airport',
            arrPt: 'LGW',
            arrDate: '2020-09-19T23:20:00+00:00',
            arrName: 'London Gatwick',
            arrItemName: 'London Gatwick',
            fltNo: 'flight-2',
            isExt: true,
            direction: RouteDirection.Inbound,
        },
    ] as IRoute[],
};

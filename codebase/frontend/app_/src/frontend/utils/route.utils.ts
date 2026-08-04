import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer, IOfferWithoutAltBoards, ITransport } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';

import isBackend from './isBackend';

export function getSingleRoute(routes: IRoute[], getLatest: boolean = true): Nullable<IRoute> {
    if (getLatest) {
        return routes?.length ? routes[routes.length - 1] : undefined;
    }

    return routes?.length ? routes[0] : undefined;
}

export function getRoute(offer: IOffer | IAlternativeOffer, direction: RouteDirection) {
    return offer.transport.routes.find(x => x.direction === direction);
}

export function areRoutesEqual(offerA: IOffer | IAlternativeOffer, offerB: IOffer | IOfferWithoutAltBoards) {
    const routeA = getRoute(offerA, RouteDirection.Outbound);
    const routeAI = getRoute(offerA, RouteDirection.Inbound);
    const routeB = getRoute(offerB, RouteDirection.Outbound);
    const routeBI = getRoute(offerB, RouteDirection.Inbound);

    return routeA?.id === routeB?.id && routeAI?.id === routeBI?.id;
}

export function getOfferRoutesUniqueId(offer: IAlternativeOffer) {
    return offer.transport.routes.map(route => route.id).join('_');
}

/**
 * Get all flights references.
 * Direct Flights (DP) always have ref ('extRefId' in route)
 * Series Seats Flights (SS) don't have ref until they are manifested ('externalPNR' for each pax in route)
 */
export const getFlightsReferences = (routes: IRoute[]) => {
    const refs: Array<string | null> = [];
    const addRef = ref => !refs.includes(ref) && refs.push(ref);

    routes.forEach(r => {
        if (r.extRefId) {
            addRef(r.extRefId);
        } else {
            r.paxs?.forEach(p => addRef(p.externalPNR || null));
        }
    });

    return refs;
};

/** Get only digital part of flight number (e.g. for "EZY2291" return "2291", where "EZY" is car) */
export const getFlightDigitalNumber = (route?: IRoute): string =>
    route?.car ? route.fltNo.replace(route.car, '') : route?.fltNo || '';

/** Get flight number with the car number if it was deleted */
export const getFlightNumberWithCarNumber = (route?: IRoute): string => {
    if (route?.car && route?.fltNo) {
        return route.fltNo.includes(route.car) ? route.fltNo : route.car + route.fltNo;
    }

    return route?.fltNo || '';
};

export function getUrlFromName(name: string): string {
    return name
        .replace(/\s+/g, '-')
        .replace(/[^-\w\s!?]/g, '')
        .replace(/-$/g, '') // remove the last character if it's equal '-'
        .toLowerCase();
}

export function isNavigatorGoBack(): boolean {
    if (isBackend() || !performance) {
        return false;
    }

    try {
        let perfEntry: PerformanceNavigationTiming | undefined;

        if (performance.getEntriesByType) {
            const perfEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
            perfEntry = perfEntries[0];
        }

        if (!!perfEntry) {
            return perfEntry.type === 'back_forward';
        }

        return performance.navigation.type === performance.navigation.TYPE_BACK_FORWARD;
    } catch (e) {
        return false;
    }
}

export const checkForEqualTransports = (transport1: ITransport, transport2: ITransport | undefined) => {
    if (!transport2) {
        return false;
    }

    return transport1.routes[0].id === transport2.routes[0].id && transport1.routes[1].id === transport2.routes[1].id;
};

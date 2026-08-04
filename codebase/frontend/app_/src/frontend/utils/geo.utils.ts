import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

export interface IPosition {
    coords: {
        latitude: number;
        longitude: number;
    };
}

export const getGeoPosition = (): Promise<IPosition> =>
    new Promise((resolve: (position: IPosition) => void, reject) => {
        navigator.geolocation.getCurrentPosition(
            position => resolve(position),
            error => reject(error),
        );
    });

export const isPointInsidePolygon = (point: number[], polygon: number[][]) => {
    const x = point[0],
        y = point[1];
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0],
            yi = polygon[i][1];
        const xj = polygon[j][0],
            yj = polygon[j][1];

        const intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
};

/** degrees to radians */
export const deg2rad = (deg: number) => deg * (Math.PI / 180);

/** get distance between points in sphere (see: https://en.wikipedia.org/wiki/Haversine_formula) */
export const getDistanceBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** get closest airport by checking its lat and long and user current position */
export const getClosestAirport = (position: IPosition, airports: IAirport[]): IAirport | undefined => {
    let closestAirport: IAirport | undefined = undefined;
    let closestDistance: number = Infinity;

    airports.forEach(airport => {
        if (!(airport.latitude && airport.longitude)) {
            return;
        }

        const airportDist = getDistanceBetweenPoints(
            position.coords.latitude,
            position.coords.longitude,
            Number(airport.latitude),
            Number(airport.longitude),
        );

        if (airportDist < closestDistance) {
            closestDistance = airportDist;
            closestAirport = airport;
        }
    });

    return closestAirport;
};

/** get all available airports from country as a flat array */
export const getAllAvailableAirports = (countries: IAirportCountry[], availableCodes?: string[] | null) => {
    const airports: IAirport[] = [];

    const isAirportAvailable = (a: IAirport) =>
        !!a.isDepartureAirport && (availableCodes ? availableCodes.includes(a.code) : true);

    const addAvailableAirports = (airportsArr: IAirport[]) => {
        const availableAirports = airportsArr.filter(isAirportAvailable);
        airports.push(...availableAirports);
    };

    countries.forEach(country => {
        country.airports.forEach(group => {
            group.airports && addAvailableAirports(group.airports);
        });

        addAvailableAirports(country.airports);
    });

    return airports;
};

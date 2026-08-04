import { IPolyBounds } from 'models/data/map/IMap';

export const getPolyQuery = (polygon: IPolyBounds): string => {
    const { lt1, lt2, ln1, ln2 } = polygon;

    return `${lt1},${ln1}|${lt1},${ln2}|${lt2},${ln2}|${lt2},${ln1}`;
};

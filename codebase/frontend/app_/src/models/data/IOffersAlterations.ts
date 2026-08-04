import { IAltBoard, IUnit } from './IOffer';

export interface IOffersAlterations {
    altBoards: IAltBoard[];
    rooms: IUnit[][];
}

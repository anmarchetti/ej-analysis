import { IUnit } from './IOffer';

export interface IOriginalRoom {
    allRoomsCodes: string[];
    alternativeRooms: IUnit[];
    index: number;
    room: IUnit;
}

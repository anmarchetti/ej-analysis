export interface IQueryRoom extends IBaseQueryRoom {
    roomCode: string;
}

export interface IBaseQueryRoom {
    adults: number;
    children: number;
    childrenAges: number[];
    infants: number;
}

export interface IQueryRoomParams {
    adults: string;
    children: string;
    childrenAges: string[];
    infants: string;
    roomCode: string;
}

export interface IQueryRoomAllocation {
    adults: number;
    children: number;
    infants: number;
    roomCode: string | undefined;
}

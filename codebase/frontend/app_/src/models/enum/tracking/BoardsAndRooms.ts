export enum BoardsAndRoomsEventAction {
    ShowBoards = 'See all board options clicked',
    HideBoards = 'Hide board options clicked',
    ShowRooms = 'See alternative rooms clicked',
    HideRooms = 'Hide alternative rooms clicked',
    ShowRoomInformation = 'Room information clicked',
    ShowOtherRooms = 'Other rooms available clicked',
    HideRoomInformation = 'Close button clicked',
    RoomSelected = 'Room selected',
    BoardSelected = 'Board selected',
    AlterationConfirm = 'Board and Room Update - Confirm changes clicked',
    AlterationCancel = 'Board and Room Update - Cancel changes clicked',
    ShowRoomsOnExtras = 'Edit your room clicked',
    ShowBoardsOnExtras = 'Edit your board clicked',
}

export enum PostBookingBoardsAndRoomsEventAction {
    SeeAllBoardOptions = 'See all board options',
    SeeAlternativeRooms = 'See alternative rooms',
    HideBoardOptions = 'Hide Board Options',
    HideAlternativeRooms = 'Hide alternative rooms',
}

export enum BoardsAndRoomsEventCategory {
    Room = 'Room',
    Board = 'Board',
    BoardAndRoom = 'Board and Room',
}

export enum BoardsAndRoomsGenericValues {
    NA = 'NA',
    RoomAlterations = 'Requires room alterations',
    BoardAlterations = 'Requires board alterations',
    BoardAndRoomAlterations = 'Requires board and room alterations',
    Upgrade = 'Upgrade',
    Downgrade = 'Downgrade',
}

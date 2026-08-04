export enum HeaderEvents {
    ToggleMobile = 'HeaderEvents_ToggleMobile',
}

export interface IHeaderEventsPayload {
    [HeaderEvents.ToggleMobile]: { isOpen: boolean };
}

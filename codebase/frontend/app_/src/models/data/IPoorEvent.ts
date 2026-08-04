import { EventTypes } from 'models/enum/tracking/EventTypes';

export interface IPoorEvent {
    event: EventTypes;
    dimension13?: string;
    dimension136?: string;
    pageReferral?: string;
}

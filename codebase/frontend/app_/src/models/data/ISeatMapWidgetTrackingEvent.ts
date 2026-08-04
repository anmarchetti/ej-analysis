import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';

export type TSeatTogetherCheckbox = 'checked' | 'unchecked' | 'unavailable';

/**
 * Data that comes from Seat Map Widget
 * IMPORTANT: must be the same as interface in the widget:
 * models/data/ITrackingEvent.ts
 */
export interface ISeatMapWidgetTrackingEvent {
    code: TrackingEventCodes;
    data: ISitTogetherClickedData | ISitTogetherImpressionData;
}

export interface ISitTogetherClickedData {
    flightDirection: SeatMapFlightDirection;
    isChecked: boolean;
}

export interface ISitTogetherImpressionData {
    flightDirection: SeatMapFlightDirection;
    isAvailable: boolean;
}

export enum TrackingEventCodes {
    SitTogetherImpression = 'sitTogetherImpression',
    SitTogetherClicked = 'sitTogetherClicked',
}

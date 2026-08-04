import { NavigationActionMode } from 'models/enum/NavigationActionMode';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';

/**
 * Data that comes from Seat Map Widget
 * IMPORTANT: must be the same as interface in the widget:
 * models/data/IOutputDataForApp
 */
export interface ISeatMapWidgetValue {
    actionMode: NavigationActionMode;
    direction: SeatMapFlightDirection;
    isSelectionEmpty: boolean;
    isSelectionImpossible: boolean;
    isSelectionIncorrect: boolean;
    selectedSeatLength: number;
    formattedTotalPrice?: string;
}

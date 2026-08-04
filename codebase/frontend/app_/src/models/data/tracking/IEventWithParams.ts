import { DecisionValues } from 'frontend/utils/string.utils';
import { IQuizResult } from 'models/data/IHolidayInspiration';
import {
    BoardsAndRoomsEventAction,
    BoardsAndRoomsEventCategory,
    PostBookingBoardsAndRoomsEventAction,
} from 'models/enum/tracking/BoardsAndRooms';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';

import { ICoreParams } from './ICoreParams';

type TStringNumberOrNull = string | number | null;

export interface IEventParams {
    action?: string;
    bookingId?: string;
    country?: string;
    cta?: string | null;
    destination?: string;
    destinationPath?: string;
    eventAction?: EventActions | BoardsAndRoomsEventAction | string;
    eventCategory?: EventCategories | BoardsAndRoomsEventCategory;
    eventLabel?: Nullable<EventLabels | PostBookingBoardsAndRoomsEventAction | string>;
    eventType?: EventTypes;
    eventValue?: TStringNumberOrNull;
    helpCategory?: string;
    helpQuestion?: string;
    location?: string;
    moduleId?: string;
    name?: string;
    numOfRequests?: number;
    position?: string | number;
    price?: string | number;
    reqsSelected?: string;
    section?: string;
    status?: string;
    type?: string;
    typesCode?: string[];
    url?: string;
    useful?: DecisionValues;
}

export interface IModuleClickEventParams {
    destinationPath: string; // pathOfTheClickedElement (e.g. /cyprus/larnaca/ayia-napa/amarande-hotel)
    moduleId: string;
    name: string; // nameOfModule (e.g. "Most Popular Destinations")
    selection: string; // nameOfSelection (e.g. "Amarande Hotel")
    isPriceVisible?: string; // 'Yes'/ 'No'
    location?: string; // locationOfTheModule (e.g. "Mid Banner")
    position?: number; // positionOfTheClickedElement
}

export interface INavigationClickEventParams {
    destination: string; // pathOfTheClickedElement (e.g. 'https://www.easyjet.com/en/holidays/germany/berlin' or 'Not Linkable')
    location: string; // locationOfTheModule (e.g. "Top Overlay Menu")
    name: string; // nameOfModule (e.g. "Berlin")
    position: string; // position of the parent item | position of the current item (e.g. 4|3|6 for Berlin from Destinations in Top City Breaks section
    type: string; // 'link' / 'banner'/ 'image' etc.
    parentItem?: string; // 'Destinations';
    section?: string; // 'Top City Breaks';
}

export interface IHolidayTypesHubEventParams {
    destination?: string;
    destinationName?: string;
    location?: string; // page name
    moduleTitle?: string;
    name?: string;
    position?: string;
    price?: string;
    sponsored?: string;
    url?: string;
}

export interface IExcursionsEventParams extends IEventParams {
    FreeCancellationDisplayed?: string;
    MoreInfoDisplayed?: string;
    OverlayMessage?: string;
}

export interface IHomepageEventParams extends IEventParams {
    OverlayMessage?: string;
    friendlyID?: string;
    selection_attribute?: string;
}

export interface ICustomParams {
    destinationUrl?: string | null;
    genericValue1?: TStringNumberOrNull;
    genericValue2?: TStringNumberOrNull;
    genericValue3?: TStringNumberOrNull;
    genericValue4?: TStringNumberOrNull;
}

export interface IEventWithParamsDLObject {
    event: EventTypes;
    eventParams: IEventParams | IQuizResult;
    coreParams?: Partial<ICoreParams> | null;
    customParams?: ICustomParams;
    pageReferral?: string;
}

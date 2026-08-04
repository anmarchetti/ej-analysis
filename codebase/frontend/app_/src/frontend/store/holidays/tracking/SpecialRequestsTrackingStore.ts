import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { IBookingSpecialRequest } from 'models/data/IBookingInfo';
import { IFlattenedSpecialRequest } from 'models/data/SpecialRequest';
import { ICustomParams } from 'models/data/tracking/IEventWithParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import TrackingStore from './TrackingStore';

export class SpecialRequestsTrackingStore {
    private addToDataLayer: TrackingStore['addToDataLayer'];
    private buildCoreParamsObject: TrackingStore['buildCoreParamsObject'];

    constructor(trackingStore: TrackingStore) {
        this.addToDataLayer = trackingStore.addToDataLayer;
        this.buildCoreParamsObject = trackingStore.buildCoreParamsObject;
    }

    private buildBaseDimensions = (
        bookingRef: string,
        requests: (IBookingSpecialRequest | IFlattenedSpecialRequest)[] = [],
        extendedCustomParams: Record<string, string | null> = {},
        extendedEventParams: Record<string, string> = {},
    ) => {
        const customParams = generateGenericValues({
            genericValue1: this.getSpecialRequestsDimension(requests),
            genericValue4: bookingRef,
            ...extendedCustomParams,
        });
        const eventParams = {
            eventCategory: EventCategories.SpecialServiceRequest,
            eventAction: EventActions.RequestSpecialService,
            eventType: EventTypes.Interaction,
            ...extendedEventParams,
        };

        return {
            customParams,
            eventParams,
        };
    };

    private getSpecialRequestsDimension = (requests: (IBookingSpecialRequest | IFlattenedSpecialRequest)[] = []) =>
        requests.length < 1
            ? 'NONE'
            : requests.map(({ displayName, name }: IBookingSpecialRequest) => displayName || name).join(' | ');

    private pushSRToDataLayer = (customParams: ICustomParams, eventParams: Record<string, string>) => {
        const coreParams = this.buildCoreParamsObject();
        this.addToDataLayer({ event: EventTypes.GenericEvent, coreParams, customParams, eventParams });
    };

    private contradictionSRHandle = (bookingRef: string, eventLabel: string) => {
        const { customParams } = this.buildBaseDimensions(bookingRef, undefined, { genericValue1: null });
        const eventParams = {
            eventCategory: EventCategories.Holidays,
            eventAction: EventActions.SpecialServiceRequest,
            eventType: EventTypes.Interaction,
            eventLabel,
        };

        this.pushSRToDataLayer(customParams, eventParams);
    };

    private toggleClickSRToSpecialRequests = (
        bookingRef: string,
        chosenRequests: IBookingSpecialRequest[] = [],
        chosenRequestName: string,
    ) => {
        const { customParams, eventParams } = this.buildBaseDimensions(
            bookingRef,
            chosenRequests,
            {
                genericValue2: chosenRequestName,
            },
            {
                eventLabel: 'Add',
                eventCategory: EventCategories.Holidays,
                eventAction: EventActions.SpecialServiceRequest,
            },
        );

        this.pushSRToDataLayer(customParams, eventParams);
    };

    clickTrackingSRCTA = (bookingRef?: string): void => {
        if (!bookingRef) return;

        const { customParams } = this.buildBaseDimensions(bookingRef, undefined, { genericValue1: null });

        this.pushSRToDataLayer(customParams, {
            eventCategory: EventCategories.Holidays,
            eventLabel: 'Edit Special Requests',
            eventAction: EventActions.ViewBooking,
            eventType: EventTypes.Interaction,
        });
    };

    openSpecialRequests = (bookingRef?: string, chosenRequests: IBookingSpecialRequest[] = []): void => {
        if (!bookingRef) return;

        const { customParams, eventParams } = this.buildBaseDimensions(
            bookingRef,
            chosenRequests,
            {},
            { eventLabel: 'Amend' },
        );

        this.pushSRToDataLayer(customParams, eventParams);
    };

    removeSRInHasSpecialRequests = (
        bookingRef?: string,
        chosenRequests: IBookingSpecialRequest[] = [],
        chosenRequestName?: string,
    ): void => {
        if (!bookingRef || !chosenRequestName) return;

        const { customParams, eventParams } = this.buildBaseDimensions(
            bookingRef,
            chosenRequests,
            {
                genericValue3: chosenRequestName,
            },
            {
                eventLabel: 'Removed',
                eventCategory: EventCategories.Holidays,
                eventAction: EventActions.SpecialServiceRequest,
            },
        );

        this.pushSRToDataLayer(customParams, eventParams);
    };

    // Contradiction SR
    contradictionToggleSpecialRequests = (
        bookingRef?: string,
        chosenRequests: IBookingSpecialRequest[] = [],
        newOptionName?: string,
        previousOptionName?: string,
        type: 'KeepOld' | 'GetNew' = 'GetNew',
    ): void => {
        if (!bookingRef || !previousOptionName || !newOptionName) return;

        const eventLabel = type === 'GetNew' ? 'Contradiction: Continue with New' : 'Contradiction: Keep Original';
        this.toggleClickSRToSpecialRequests(bookingRef, chosenRequests, newOptionName);

        this.contradictionSRHandle(bookingRef, eventLabel);

        this.removeSRInHasSpecialRequests(
            bookingRef,
            chosenRequests,
            type === 'GetNew' ? previousOptionName : newOptionName,
        );
    };

    // Submit SR requests
    submitSpecialRequests = (bookingRef?: string, chosenRequests: IFlattenedSpecialRequest[] = []): void => {
        if (!bookingRef) return;

        const { customParams, eventParams } = this.buildBaseDimensions(
            bookingRef,
            chosenRequests,
            {},
            {
                eventAction: EventActions.SubmitRequest,
                eventLabel: 'SSR Updated',
            },
        );

        this.pushSRToDataLayer(customParams, eventParams);
    };

    handleClickSpecialRequestItem = (
        bookingReference: string,
        bookingRequests: IBookingSpecialRequest[],
        currentRequest: IFlattenedSpecialRequest,
    ): void => {
        if (!bookingReference || !currentRequest) return;

        if (currentRequest.isSelected) {
            this.toggleClickSRToSpecialRequests(bookingReference, bookingRequests, currentRequest.name);

            return;
        }

        this.removeSRInHasSpecialRequests(bookingReference, bookingRequests, currentRequest.name);
    };
}

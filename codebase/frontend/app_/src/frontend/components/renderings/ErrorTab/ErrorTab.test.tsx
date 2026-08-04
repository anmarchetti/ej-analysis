import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import ErrorTab, { TErrorTabProps } from './ErrorTab';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tracking/inspireMeQuiz.utils');
jest.mock('frontend/utils/tracking/tracking.utils');

Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload: jest.fn() },
});

const createMockProps = (): TErrorTabProps => ({
    fields: {
        Title: mockSitecoreField('Error Title'),
        Description: mockSitecoreField('Error Description'),
        RedirectCTA: mockSitecoreField(mockSitecoreLinkField('href', 'Redirect CTA')),
        RefreshCTALabel: mockSitecoreField('Refresh CTA Label'),
        TrackingItemName: mockSitecoreField('TrackingItemName'),
    },
    params: {},
    rendering: {},
});

let mockStores;
let mockProps;

describe('ErrorTab', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();

        jest.mocked(getQuizEventsCoreParamsOverride).mockReturnValue({});
        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    it('should NOT render when no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<ErrorTab {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders correctly', () => {
        render(<ErrorTab {...mockProps} />);

        expect(screen.getByTestId('error-tab-title')).toHaveTextContent(mockProps.fields.Title.value);
        expect(screen.getByTestId('error-tab-description')).toHaveTextContent(mockProps.fields.Description.value);
        expect(screen.getByRole('button', { name: mockProps.fields.RedirectCTA.value.text })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: mockProps.fields.RefreshCTALabel.value })).toBeInTheDocument();
    });

    it('should call redirect after click on action button and send GA event', () => {
        render(<ErrorTab {...mockProps} />);

        const actionButton = screen.getByRole('button', { name: mockProps.fields.RedirectCTA.value.text });
        fireEvent.click(actionButton);

        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith(mockProps.fields.RedirectCTA.value.href);
        expect(generateGenericValues).toHaveBeenCalledWith({
            destinationUrl: `${mockStores.layoutStore.sitePath}${mockProps.fields.RedirectCTA?.value?.href}`,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: mockProps.fields.RedirectCTA.value.title,
                eventType: EventTypes.Interaction,
            },
            expect.any(Object),
            undefined,
            undefined,
            expect.any(Object),
        );
    });

    it('should NOT call redirect and trackEventWithParams when there is url', () => {
        mockProps.fields.RedirectCTA.value.href = '';
        render(<ErrorTab {...mockProps} />);

        const actionButton = screen.getByRole('button', { name: mockProps.fields.RedirectCTA.value.text });
        fireEvent.click(actionButton);

        expect(actionButton).toBeDisabled();
        expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
        expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
    });

    it('should refresh page after click on refresh button and send GA event', () => {
        render(<ErrorTab {...mockProps} />);

        const refreshButton = screen.getByRole('button', { name: mockProps.fields.RefreshCTALabel.value });
        fireEvent.click(refreshButton);

        expect(window.location.reload).toHaveBeenCalled();
        expect(generateGenericValues).toHaveBeenCalledWith({
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: 'Refresh Page',
                eventType: EventTypes.Interaction,
            },
            expect.any(Object),
            undefined,
            undefined,
            expect.any(Object),
        );
    });
});

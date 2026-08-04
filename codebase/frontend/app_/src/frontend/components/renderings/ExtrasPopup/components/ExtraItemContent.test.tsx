import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreCompositeField, mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import ExtraItemContent, { TExtraItemContentProps } from './ExtraItemContent';

const mockLinkProps = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: props => {
        mockLinkProps(props);

        return <a data-tid='link' onClick={props.onClick} />;
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid='jss-text' />;
    },
}));

const createProps = (): TExtraItemContentProps => ({
    TrackingLabel: { value: 'tile-1' },
    Subtitle: { value: 'Subtitle 1' },
    Description: { value: 'Description 1' },
    CTA: mockSitecoreField(mockSitecoreLinkField('/link1', 'CTA 1')),
    Highlights: [
        mockSitecoreCompositeField('highlight1', { Title: mockSitecoreField('Highlight 1') }),
        mockSitecoreCompositeField('highlight2', { Title: mockSitecoreField('Highlight 2') }),
    ],
    index: 0,
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tracking/tracking.utils');

describe('ExtrasPopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    it('should render standard', () => {
        render(<ExtraItemContent {...mockProps} />);

        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.Subtitle,
            tag: 'h3',
            className: 'title',
            'data-tid': 'tile-subtitle',
        });

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.Description,
            dataId: 'tile-description',
        });

        expect(screen.getByTestId('tile-highlights')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.Highlights[0].fields.Title,
        });

        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.Highlights[1].fields.Title,
        });

        expect(screen.getAllByTestId('highlight')).toHaveLength(2);

        expect(mockLinkProps).toHaveBeenCalledWith({
            href: mockProps.CTA.value?.href,
            target: mockProps.CTA.value?.target,
            className: 'btn cta',
            onClick: expect.any(Function),
            'data-tid': 'tile-cta',
            children: mockProps.CTA.value?.text,
        });
    });

    it('should track event on CTA click', async () => {
        const user = userEvent.setup();
        render(<ExtraItemContent {...mockProps} />);

        const link = screen.getByTestId('link');
        await user.click(link);

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.PopupCTAClick,
                eventCategory: EventCategories.ExternalExtrasModule,
                eventLabel: mockProps.TrackingLabel.value,
                eventType: EventTypes.Interaction,
            },
            expect.any(Object),
        );

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: 1,
            destinationUrl: mockProps.CTA.value.href,
        });
    });

    it('should replace {referenceNumber} token in link URL', () => {
        mockStores = createMockStores({
            bookingStore: {
                booking: { ...mockBooking, bookingReference: 'REF123' },
            },
        });
        mockProps.CTA = mockSitecoreField(mockSitecoreLinkField('/manage/{referenceNumber}', 'CTA'));
        render(<ExtraItemContent {...mockProps} />);

        expect(mockLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                href: '/manage/REF123',
            }),
        );
    });

    it('should replace {destination} token in link URL', () => {
        mockStores = createMockStores({
            bookingStore: {
                booking: mockBooking,
            },
        });
        mockProps.CTA = mockSitecoreField(mockSitecoreLinkField('/extras/{destination}', 'CTA'));
        render(<ExtraItemContent {...mockProps} />);

        expect(mockLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                href: '/extras/spain-tenerife-playa-paraiso',
            }),
        );
    });

    it('should replace {destination} token with generic fallback when booking is null', () => {
        mockStores = createMockStores({
            bookingStore: {
                booking: null,
            },
        });
        mockProps.CTA = mockSitecoreField(mockSitecoreLinkField('/extras/{destination}', 'CTA'));
        render(<ExtraItemContent {...mockProps} />);

        expect(mockLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                href: '/extras/generic',
            }),
        );
    });

    it('should use resolved link URL (with tokens replaced) as destinationUrl in tracking', async () => {
        const user = userEvent.setup();
        mockStores = createMockStores({
            bookingStore: {
                booking: { ...mockBooking, bookingReference: 'REF456' },
            },
        });
        mockProps.CTA = mockSitecoreField(mockSitecoreLinkField('/manage/{referenceNumber}', 'CTA'));
        render(<ExtraItemContent {...mockProps} />);

        await user.click(screen.getByTestId('link'));

        expect(generateGenericValues).toHaveBeenCalledWith(
            expect.objectContaining({
                destinationUrl: '/manage/REF456',
            }),
        );
    });

    it('should NOT render highlights section when Highlights is empty', () => {
        mockProps.Highlights = [];
        render(<ExtraItemContent {...mockProps} />);

        expect(screen.queryByTestId('tile-highlights')).not.toBeInTheDocument();
    });
});

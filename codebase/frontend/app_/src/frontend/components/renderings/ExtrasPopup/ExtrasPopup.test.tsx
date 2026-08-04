import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreCompositeField, mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { ExtrasPopup, IExtrasPopupFields } from './ExtrasPopup';

let mockMoreThenMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: () => mockMoreThenMobileViewport,
}));

const mockExpandItemProps = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: ({ children, icon, expandButtonChildren, ...props }) => {
        mockExpandItemProps(props);

        return (
            <button data-tid='expand-item' onClick={props.onOpen}>
                {icon}
                {expandButtonChildren}
                {children}
            </button>
        );
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button {...props} />;
    },
}));

const mockFloatingPopupProps = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: props => {
        mockFloatingPopupProps(props);

        return (
            <div data-tid='floating-popup'>
                {props.children}
                {props.footerContent}
            </div>
        );
    },
}));

const mockExtraItemContentProps = jest.fn();
jest.mock('./components/ExtraItemContent', () => ({
    __esModule: true,
    default: props => {
        mockExtraItemContentProps(props);

        return <div data-tid='extra-item-content' />;
    },
}));

const mockPopupCloseButtonProps = jest.fn();
jest.mock('frontend/components/common/Popup/PopupCloseButton', () => ({
    __esModule: true,
    default: props => {
        mockPopupCloseButtonProps(props);

        return <button data-tid='popup-close-button' />;
    },
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
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

const createProps = (): ISitecoreComponent<IExtrasPopupFields> => ({
    fields: {
        Title: mockSitecoreField('Popup Title'),
        Subtitle: mockSitecoreField('Popup Subtitle'),
        PopularTagLabel: mockSitecoreField('Popular'),
        CloseButtonLabel: mockSitecoreField('Close'),
        CloseButtonScreenReaderLabel: mockSitecoreField('Close popup'),
        Children: [
            {
                id: 'tile1',
                fields: {
                    Title: mockSitecoreField('Tile 1'),
                    TrackingLabel: mockSitecoreField('tile-1'),
                    ShowPopularTag: mockSitecoreField(false),
                    Logo: mockSitecoreField({ src: 'logo1.png' }),
                    Subtitle: mockSitecoreField('Subtitle 1'),
                    Description: mockSitecoreField('Description 1'),
                    CTA: mockSitecoreField(mockSitecoreLinkField('/link1', 'CTA 1')),
                    Highlights: [
                        mockSitecoreCompositeField('highlight1', { Title: mockSitecoreField('Highlight 1') }),
                        mockSitecoreCompositeField('highlight2', { Title: mockSitecoreField('Highlight 2') }),
                    ],
                    UniqueKey: mockSitecoreField('key1'),
                },
                displayName: 'tile 1',
                name: 'tile 1',
            },
            {
                id: 'tile2',
                fields: {
                    Title: mockSitecoreField('Tile 2'),
                    TrackingLabel: mockSitecoreField('tile-2'),
                    ShowPopularTag: mockSitecoreField(true),
                    Logo: mockSitecoreField({ src: 'logo2.png' }),
                    Subtitle: mockSitecoreField('Subtitle 2'),
                    Description: mockSitecoreField('Description 2'),
                    CTA: mockSitecoreField(mockSitecoreLinkField('/link2', 'CTA 2')),
                    Highlights: [],
                    UniqueKey: mockSitecoreField('key2'),
                },
                displayName: 'tile 2',
                name: 'tile 2',
            },
            {
                id: 'tile3',
                fields: {
                    Title: mockSitecoreField('Tile 3'),
                    TrackingLabel: mockSitecoreField('tile-3'),
                    ShowPopularTag: mockSitecoreField(true),
                    Logo: mockSitecoreField({ src: 'logo3.png' }),
                    Subtitle: mockSitecoreField('Subtitle 3'),
                    Description: mockSitecoreField('Description 3'),
                    CTA: mockSitecoreField(mockSitecoreLinkField('/link3', 'CTA 3')),
                    Highlights: [],
                    UniqueKey: mockSitecoreField('airport-parking'),
                },
                displayName: 'tile 3',
                name: 'tile 3',
            },
        ],
    },
    params: {},
    rendering: {},
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            booking: { ...mockBooking, airportParking: null },
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tracking/tracking.utils');

describe('ExtrasPopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    it('should NOT render and call tracking when fields are NOT provided', () => {
        delete mockProps.fields;
        const { container } = render(<ExtrasPopup {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
        expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
    });

    it('should NOT render and call tracking when Children are NOT provided', () => {
        mockProps.fields!.Children = [];
        const { container } = render(<ExtrasPopup {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
        expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
    });

    it('should NOT render and call tracking when booking is NOT provided', () => {
        mockStores = createMockStores({
            bookingStore: {
                booking: null,
            },
        });
        const { container } = render(<ExtrasPopup {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
        expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
    });

    it('should render standard with first opened tile by default', () => {
        render(<ExtrasPopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopupProps).toHaveBeenCalledWith({
            onClose: expect.any(Function),
            footerContent: expect.anything(),
            footerClass: 'footerContainer',
            containerClass: 'contentContainer',
            bodyClass: 'bodyContainer',
            children: expect.anything(),
            id: 'extras-popup',
            contentClass: 'container',
        });

        expect(screen.getByTestId('extras-popup-close-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'closeButton',
            isLabel: true,
            onClick: expect.any(Function),
            'aria-label': mockProps.fields!.CloseButtonScreenReaderLabel.value,
            children: mockProps.fields!.CloseButtonLabel.value,
            'data-tid': 'extras-popup-close-button',
        });

        expect(screen.getAllByTestId('jss-text')).toHaveLength(5);
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Title,
            tag: 'h2',
            className: 'title',
            'data-tid': 'extras-popup-title',
        });

        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Subtitle,
            tag: 'span',
            className: 'subtitle',
            'data-tid': 'extras-popup-subtitle',
        });

        expect(screen.getAllByTestId('expand-item')).toHaveLength(3);
        expect(screen.getAllByTestId('extra-item-content')).toHaveLength(3);

        expect(mockExpandItemProps).toHaveBeenCalledWith({
            titleWrapperClassName: 'tileTitleWrapper',
            isOpened: true,
            onOpen: expect.any(Function),
            className: 'expandableItem',
            expandButtonClassName: 'expandButton isActive',
            expandArrowClassName: 'expandArrow',
            dataTid: 'extra-tile-key2',
        });
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Children[1].fields.Title,
            tag: 'h3',
            className: 'tileTitle',
            'data-tid': 'tile-title',
        });

        expect(mockExtraItemContentProps).toHaveBeenCalledWith({
            index: 0,
            ...mockProps.fields!.Children[1].fields,
        });

        expect(mockExpandItemProps).toHaveBeenCalledWith({
            titleWrapperClassName: 'tileTitleWrapper',
            isOpened: false,
            onOpen: expect.any(Function),
            className: 'expandableItem',
            expandButtonClassName: 'expandButton',
            expandArrowClassName: 'expandArrow',
            dataTid: 'extra-tile-airport-parking',
        });
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Children[2].fields.Title,
            tag: 'h3',
            className: 'tileTitle',
            'data-tid': 'tile-title',
        });
        expect(mockExtraItemContentProps).toHaveBeenCalledWith({
            index: 1,
            ...mockProps.fields!.Children[2].fields,
        });

        expect(screen.getAllByTestId('jss-image')).toHaveLength(3);
        expect(mockJSSImageProps).toHaveBeenCalledWith({
            field: mockProps.fields!.Children[1].fields.Logo,
            dataTid: 'tile-logo',
            className: 'tileIcon',
        });
        expect(mockJSSImageProps).toHaveBeenCalledWith({
            field: mockProps.fields!.Children[2].fields.Logo,
            dataTid: 'tile-logo',
            className: 'tileIcon',
        });

        expect(mockPopupCloseButtonProps).toHaveBeenCalledWith({
            onClick: expect.any(Function),
            className: 'closeIcon',
            'aria-label': mockProps.fields!.CloseButtonScreenReaderLabel.value,
            'data-tid': 'extras-popup-close-icon',
        });
    });

    it('should NOT render airport parking tile when booking does include parking', () => {
        mockStores.bookingStore.booking = {
            ...mockStores.bookingStore.booking,
            airportParking: {},
        };
        render(<ExtrasPopup {...mockProps} />);
        expect(screen.getAllByTestId('expand-item')).toHaveLength(2);
        expect(screen.queryByTestId('extra-tile-airport-parking')).not.toBeInTheDocument();
    });

    it('should NOT render close icon button on mobile viewport', () => {
        mockMoreThenMobileViewport = false;
        render(<ExtrasPopup {...mockProps} />);

        expect(mockPopupCloseButtonProps).not.toHaveBeenCalled();
    });

    it('should render Popular tag when ShowPopularTag is true and sort tiles with popular tag first', () => {
        render(<ExtrasPopup {...mockProps} />);

        expect(within(screen.getAllByTestId('expand-item')[0]).getByTestId('popular-tag')).toBeInTheDocument();
        expect(within(screen.getAllByTestId('expand-item')[1]).getByTestId('popular-tag')).toBeInTheDocument();
        expect(within(screen.getAllByTestId('expand-item')[2]).queryByTestId('popular-tag')).not.toBeInTheDocument();
    });

    it('should close tile when clicking on already opened tile ', async () => {
        render(<ExtrasPopup {...mockProps} />);
        const firstTileCTA = screen.getAllByTestId('expand-item')[0];
        await userEvent.click(firstTileCTA);

        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'extra-tile-key1',
                isOpened: false,
            }),
        );
    });

    it('should open tile and close opened one when clicking on closed tile ', async () => {
        render(<ExtrasPopup {...mockProps} />);
        const closedTileCTA = screen.getAllByTestId('expand-item')[1];
        await userEvent.click(closedTileCTA);

        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'extra-tile-key1',
                isOpened: false,
            }),
        );
        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'extra-tile-key2',
                isOpened: true,
            }),
        );
    });

    it('should close popup when clicking on close button', async () => {
        const { container } = render(<ExtrasPopup {...mockProps} />);
        const closeButton = screen.getByTestId('extras-popup-close-button');
        await userEvent.click(closeButton);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Tracking', () => {
        it('should track popup impression on mount', () => {
            render(<ExtrasPopup {...mockProps} />);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.PopupImpression,
                    eventCategory: EventCategories.ExternalExtrasModule,
                    eventLabel: null,
                    eventType: EventTypes.NonInteraction,
                },
                expect.any(Object),
            );

            expect(generateGenericValues).toHaveBeenCalledWith({
                destinationUrl: null,
            });
        });

        it('should track popup close event when closing', async () => {
            render(<ExtrasPopup {...mockProps} />);

            await userEvent.click(screen.getByTestId('extras-popup-close-button'));

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.PopupClose,
                    eventCategory: EventCategories.ExternalExtrasModule,
                    eventLabel: null,
                    eventType: EventTypes.Interaction,
                },
                expect.any(Object),
            );

            expect(generateGenericValues).toHaveBeenCalledWith({
                destinationUrl: null,
            });
        });

        it('should NOT track tile expansion event when closing a tile: first tile is opened by default', async () => {
            render(<ExtrasPopup {...mockProps} />);
            const firstTileCTA = screen.getAllByTestId('expand-item')[0];
            await userEvent.click(firstTileCTA);

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledTimes(1);
        });

        it('should track tile expansion event when opening a tile', async () => {
            render(<ExtrasPopup {...mockProps} />);

            const firstTileCTA = screen.getAllByTestId('expand-item')[1];
            await userEvent.click(firstTileCTA);

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.PopupAccordionOpen,
                    eventCategory: EventCategories.ExternalExtrasModule,
                    eventLabel: mockProps.fields!.Children[2].fields.TrackingLabel.value,
                    eventType: EventTypes.Interaction,
                },
                expect.any(Object),
            );

            expect(generateGenericValues).toHaveBeenCalledWith({
                destinationUrl: null,
            });
        });
    });
});

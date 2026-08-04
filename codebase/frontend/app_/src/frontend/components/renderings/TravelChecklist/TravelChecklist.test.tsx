import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import TravelChecklist, { TTravelChecklistProps } from './TravelChecklist';

const createProps = (): TTravelChecklistProps => ({
    fields: {
        Title: mockSitecoreField('title'),
        Description: mockSitecoreField('description'),
        TitleKeys: [
            { id: '1', fields: { Value: mockSitecoreField('FCDO') } },
            { id: '2', fields: { Value: mockSitecoreField('Passport') } },
            { id: '3', fields: { Value: mockSitecoreField('Safety') } },
            { id: '4', fields: { Value: mockSitecoreField('Insurance') } },
        ],
        FCDO: mockSitecoreField('Travel Advice'),
        Passport: mockSitecoreField('Passport requirements'),
        Insurance: mockSitecoreField('Tourist tax'),
        Safety: mockSitecoreField('Safety & wellbeing'),
    },
    params: {},
    rendering: {},
});

let props: TTravelChecklistProps;
let mockStores;

const mockRichTextWithLinksComponent = jest.fn();
const mockTravelChecklistItemComponent = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksComponent(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

jest.mock('./components/TravelChecklistItem/TravelChecklistItem', () => ({
    __esModule: true,
    default: props => {
        mockTravelChecklistItemComponent(props);

        return <div data-tid='travel-checklist-item-component' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TravelChecklist />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should render travel checklist component', () => {
        render(<TravelChecklist {...props} />);

        expect(screen.getByTestId('travel-checklist-container')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(props.fields!.Title.value);
        expect(mockRichTextWithLinksComponent).toHaveBeenCalledWith(
            expect.objectContaining({ field: props.fields!.Description }),
        );
        expect(mockTravelChecklistItemComponent).not.toHaveBeenCalled();
    });

    it('should render one checklist item when booking have healthEntryRequirements and item tracking label matches with sitecore Title field name', () => {
        mockStores.viewBookingStore.booking.healthEntryRequirements = [
            { title: 'item 1', description: 'description 1', trackingLabel: 'Spain FCDO' },
            { title: 'item 2', description: 'description 2', trackingLabel: 'test' },
        ];

        render(<TravelChecklist {...props} />);

        expect(mockTravelChecklistItemComponent).toHaveBeenCalledTimes(1);
        expect(mockTravelChecklistItemComponent).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                subtitle: 'item 1',
                description: 'description 1',
                trackingLabel: 'Spain FCDO',
                title: props.fields?.FCDO.value,
            }),
        );
    });

    it('should not render checklist items when sitecore TitleKeys are not defined', () => {
        props.fields!.TitleKeys = undefined as any;
        mockStores.viewBookingStore.booking.healthEntryRequirements = [
            { title: 'item 1', description: 'description 1', trackingLabel: 'Spain FCDO' },
        ];

        render(<TravelChecklist {...props} />);

        expect(mockTravelChecklistItemComponent).not.toHaveBeenCalled();
    });

    it('should not render a card title without a Sitecore value', () => {
        props.fields!.Title.value = '';

        render(<TravelChecklist {...props} />);

        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('should not render the component when booking is not defined', () => {
        mockStores.viewBookingStore.booking = undefined;

        const { container } = render(<TravelChecklist {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render the component when sitecore fields are not defined', () => {
        props.fields = undefined;

        const { container } = render(<TravelChecklist {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render checklist items that does NOT match any sitecore Title field name', () => {
        mockStores.viewBookingStore.booking.healthEntryRequirements = [
            { title: 'item 1', description: 'description 1', trackingLabel: 'test' },
        ];

        props.fields!.TitleKeys = [
            { id: '1', fields: { Value: mockSitecoreField('FCDO') } },
            { id: '2', fields: { Value: mockSitecoreField('Passport') } },
            { id: '3', fields: { Value: mockSitecoreField('Safety') } },
            { id: '4', fields: { Value: mockSitecoreField('Insurance') } },
        ];

        render(<TravelChecklist {...props} />);

        expect(mockTravelChecklistItemComponent).not.toHaveBeenCalled();
    });
});

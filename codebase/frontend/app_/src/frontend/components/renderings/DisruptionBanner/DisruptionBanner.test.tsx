import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { DisruptionLevel } from 'models/data/IBookingInfo';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';

import DisruptionBanner, { IDisruptionBannerFields, IDisruptionItem, TDisruptionBannerProps } from './DisruptionBanner';

expect.extend(toHaveNoViolations);

const mockDisruptionItemContent = (level: string, visible: boolean = true): ISitecoreChildren<IDisruptionItem> => ({
    displayName: `item ${level}`,
    fields: {
        Description: mockSitecoreField('Description'),
        DisruptionLevel: mockSitecoreField(level),
        Title: mockSitecoreField(`Level ${level}`),
        Visible: mockSitecoreField(visible),
    },
    id: level,
    name: `item ${level}`,
});

const mockDisruptionContentFields: IDisruptionBannerFields = {
    Children: [mockDisruptionItemContent('1'), mockDisruptionItemContent('2')],
    CollapseButtonAriaLabel: mockSitecoreField('CollapseButtonAriaLabel'),
    ExpandButtonAriaLabel: mockSitecoreField('ExpandButtonAriaLabel'),
};

const createProps = (): TDisruptionBannerProps => ({
    fields: mockDisruptionContentFields,
    rendering: {},
    params: {},
});

const createStores = () =>
    createMockStores({
        viewBookingStore: {
            booking: {},
            getBookingDisruptions: [DisruptionLevel.One, DisruptionLevel.Two],
        },
    });

let mockProps: TDisruptionBannerProps;
let mockStores = createStores();

const mockBookingAlertComponent = jest.fn();

jest.mock('frontend/components/common/Booking/BookingAlert/BookingAlert', () => ({
    __esModule: true,
    default: props => {
        mockBookingAlertComponent(props);

        return <div data-tid='booking-alert' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<DisruptionBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render banner component', () => {
        render(<DisruptionBanner {...mockProps} />);

        expect(screen.getByTestId('disruption-banner')).toBeInTheDocument();
        expect(screen.getAllByTestId('booking-alert')).toHaveLength(2);
        expect(mockBookingAlertComponent).toHaveBeenCalledWith({
            title: mockDisruptionContentFields.Children[0].fields.Title,
            content: mockDisruptionContentFields.Children[0].fields.Description,
            expandBtnAriaLabel: mockDisruptionContentFields.ExpandButtonAriaLabel.value,
            collapseBtnAriaLabel: mockDisruptionContentFields.CollapseButtonAriaLabel.value,
        });
        expect(mockBookingAlertComponent).toHaveBeenCalledWith({
            title: mockDisruptionContentFields.Children[1].fields.Title,
            content: mockDisruptionContentFields.Children[1].fields.Description,
            expandBtnAriaLabel: mockDisruptionContentFields.ExpandButtonAriaLabel.value,
            collapseBtnAriaLabel: mockDisruptionContentFields.CollapseButtonAriaLabel.value,
        });
    });

    it('should not render the component when sitecore data source are not defined', () => {
        mockProps.fields = undefined;

        const { container } = render(<DisruptionBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render the component when no sitecore content found for disruptions', () => {
        mockProps.fields = {
            ...mockDisruptionContentFields,
            Children: [mockDisruptionItemContent('1', false), mockDisruptionItemContent('2', false)],
        };

        const { container } = render(<DisruptionBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render the component when sitecore disruptions content are not defined', () => {
        mockProps.fields = { ...mockDisruptionContentFields, Children: [] };

        const { container } = render(<DisruptionBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render the component when there are no booking disruptions', () => {
        mockStores.viewBookingStore.getBookingDisruptions = [];

        const { container } = render(<DisruptionBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render booking alerts if there is no sitecore content for that disruption', () => {
        mockStores.viewBookingStore.getBookingDisruptions = [DisruptionLevel.Three];

        render(<DisruptionBanner {...mockProps} />);

        expect(screen.queryByTestId('booking-alert')).not.toBeInTheDocument();
    });

    it('should not render booking alert if it is disabled in sitecore', () => {
        mockProps.fields = {
            ...mockDisruptionContentFields,
            Children: [mockDisruptionItemContent('1', false), mockDisruptionItemContent('2')],
        };
        render(<DisruptionBanner {...mockProps} />);

        expect(screen.getAllByTestId('booking-alert')).toHaveLength(1);
        expect(mockBookingAlertComponent).not.toHaveBeenCalledWith({
            title: mockDisruptionContentFields.Children[0].fields.Title,
            content: mockDisruptionContentFields.Children[0].fields.Description,
            expandBtnAriaLabel: mockDisruptionContentFields.ExpandButtonAriaLabel.value,
            collapseBtnAriaLabel: mockDisruptionContentFields.CollapseButtonAriaLabel.value,
        });
        expect(mockBookingAlertComponent).toHaveBeenCalledWith({
            title: mockDisruptionContentFields.Children[1].fields.Title,
            content: mockDisruptionContentFields.Children[1].fields.Description,
            expandBtnAriaLabel: mockDisruptionContentFields.ExpandButtonAriaLabel.value,
            collapseBtnAriaLabel: mockDisruptionContentFields.CollapseButtonAriaLabel.value,
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<DisruptionBanner {...mockProps} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});

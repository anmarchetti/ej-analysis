import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import * as tabUtils from 'frontend/components/common/TabAccordion/utils/tabAccordion.utils';

import { mockAlertsInformationSitecore, mockAlertsItems } from './__mocks__/alertsInformation';
import AlertInformation, { TAlertInformationItemProps } from './AlertInformation';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockIsMoreThenTabletScreen = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenTabletViewport: jest.fn(() => mockIsMoreThenTabletScreen),
}));

const mockTabAccordionProps = jest.fn();
jest.mock('frontend/components/common/TabAccordion/TabAccordion', () => ({
    __esModule: true,
    default: props => {
        mockTabAccordionProps(props);

        return (
            <div data-tid='tab-accordion'>
                {props.items.map(item => (
                    <button
                        data-tid={`tab-button-${item.id}`}
                        key={item.id}
                        onClick={() => {
                            props.onTabClick(item);
                        }}
                    />
                ))}
                {props.renderContent(props.items[0])}
            </div>
        );
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

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

const createProps = (): TAlertInformationItemProps => ({
    fields: {
        Links: mockAlertsInformationSitecore,
        Title: mockSitecoreField('Information update'),
        Subtitle: mockSitecoreField('Lorem ipsum dolor sit amet'),
        Description: mockSitecoreField('Description'),
    },
    params: {},
    rendering: {},
});

let mockProps = createProps();
let mockStores;
const mockGetTabItems = jest.spyOn(tabUtils, 'getTabItems');

describe('<AlertInformation />', () => {
    beforeEach(() => {
        mockGetTabItems.mockReturnValue(mockAlertsItems);
        mockProps = createProps();
        mockStores = createMockStores({
            appStore: {
                alertActiveTab: 'hello',
                setAlertInfoLoaded: jest.fn(),
            },
            trackingStore: {
                trackEventWithParams: jest.fn(),
            },
        });
    });

    it('Should not render AlertInformation if no fields', () => {
        delete mockProps.fields;
        const { container } = render(<AlertInformation {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render component with Links', () => {
        render(<AlertInformation {...mockProps} />);

        expect(screen.getByTestId('alert-information-title')).toBeInTheDocument();
        expect(screen.getByTestId('alert-information-subtitle')).toBeInTheDocument();

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();
        expect(mockTabAccordionProps).toHaveBeenCalledWith({
            renderContent: expect.any(Function),
            items: mockAlertsItems,
            onTabClick: expect.any(Function),
            tabAccordionClassName: 'tabAccordionContainer',
            defaultSelectedTabId: undefined,
            tabToggleClassName: 'tabToggle',
            tabToggleSelectedClassName: 'tabToggleSelected',
        });

        expect(within(screen.getByTestId('tab-accordion')).getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockAlertsItems[0].ContentTab,
            tag: 'div',
            className: 'rich-editor-media content',
        });
    });

    it('should render TabAccordion without content when ContentTab is NOT provided', () => {
        const testTabs = [
            {
                id: '1',
                TitleTab: mockSitecoreField('question'),
            },
            {
                id: '2',
                TitleTab: mockSitecoreField('second question'),
            },
        ];
        mockGetTabItems.mockReturnValue(testTabs);

        render(<AlertInformation {...mockProps} />);

        expect(mockRichTextWithLinksProps).not.toHaveBeenCalled();
        expect(mockTabAccordionProps).toHaveBeenCalledWith({
            renderContent: expect.any(Function),
            items: testTabs,
            onTabClick: expect.any(Function),
            tabAccordionClassName: 'tabAccordionContainer',
            defaultSelectedTabId: undefined,
            tabToggleClassName: 'tabToggle',
            tabToggleSelectedClassName: 'tabToggleSelected',
        });
    });

    it('Should render component with one link', () => {
        mockProps.fields!.Links = [mockProps.fields!.Links[0]];
        render(<AlertInformation {...mockProps} />);

        expect(screen.queryByTestId('tab-accordion')).not.toBeInTheDocument();

        expect(screen.getByTestId('alert-information-title')).toBeInTheDocument();
        expect(screen.getByTestId('alert-information-subtitle')).toBeInTheDocument();

        expect(screen.getByTestId('alert-information-one-item-container')).toBeInTheDocument();
        expect(screen.getByTestId('alert-information-one-item-title')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields!.Links[0].fields?.Question,
            tag: 'p',
            className: 'oneItemTitle',
            'data-tid': 'alert-information-one-item-title',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields!.Links[0].fields?.Answer,
            className: 'oneItemDescription',
            dataId: 'alert-information-one-item-description',
        });
    });

    it('should call onTogglePanel when user clicks tab', async () => {
        render(<AlertInformation {...mockProps} />);

        await userEvent.click(screen.getByTestId(`tab-button-${mockProps.fields!.Links[0].id}`));

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventAction: mockProps.fields!.Title.value,
                eventCategory: EventCategories.AlertsModule,
                eventLabel: mockProps.fields!.Links[0].fields?.Question.value,
                eventType: EventTypes.Interaction,
                eventValue: 'null',
            },
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
    });

    it('Should NOT render component when no fields provided', () => {
        delete mockProps.fields;
        const { container } = render(<AlertInformation {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component when no Links provided', () => {
        mockProps.fields!.Links = [];
        const { container } = render(<AlertInformation {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should initialize selectedTab when alertActiveTab matches a link anchor', () => {
        mockStores.appStore.alertActiveTab = mockAlertsInformationSitecore[0].fields!.Anchor.value;

        render(<AlertInformation {...mockProps} />);

        expect(mockTabAccordionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                defaultSelectedTabId: mockAlertsInformationSitecore[0].id,
            }),
        );
        expect(mockRichTextWithLinksProps).toHaveBeenLastCalledWith({
            field: mockAlertsItems[0].ContentTab,
            tag: 'div',
            className: 'rich-editor-media content',
        });
    });

    it('should select tab and show its content when tab is clicked', async () => {
        render(<AlertInformation {...mockProps} />);

        await userEvent.click(screen.getByTestId(`tab-button-${mockAlertsItems[0].id}`));

        expect(mockRichTextWithLinksProps).toHaveBeenLastCalledWith({
            field: mockAlertsItems[0].ContentTab,
            tag: 'div',
            className: 'rich-editor-media content',
        });
    });

    it('should deselect tab and hide its content when clicking the selected tab again', async () => {
        mockIsMoreThenTabletScreen = false;
        mockStores.appStore.alertActiveTab = mockAlertsInformationSitecore[0].fields!.Anchor.value;

        render(<AlertInformation {...mockProps} />);

        await userEvent.click(screen.getByTestId(`tab-button-${mockAlertsItems[0].id}`));

        expect(mockRichTextWithLinksProps).toHaveBeenLastCalledWith({
            field: mockAlertsItems[0].ContentTab,
            tag: 'div',
            className: 'rich-editor-media content contentHidden',
        });
    });
});

import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { MerchandisingAlertBanner } from 'frontend/components/renderings/MerchandisingAlertBanner/MerchandisingAlertBanner';

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('title'),
        Text: mockSitecoreField('description'),
        Icon: { value: mockSitecoreImageField('image') },
        Link: mockSitecoreField({
            href: '/link',
            text: 'link',
            linktype: SitecoreLinkType.Internal,
        }),
    },
    wasRerendered: true,
});

const createStores = () => ({
    layoutStore: { isEditMode: false },
    appStore: {
        isScreenMedium: true,
        isScreenLessMedium: false,
    },
    trackingStore: { trackEventWithParams: jest.fn() },
});

let mockProps;
const mockStores = createStores();

const mockUseInView = { inView: true };
jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    useInView: jest.fn(() => mockUseInView),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, ...props }) => (
        <div data-tid='link' {...props}>
            RouterLink.{children}
        </div>
    ),
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

describe('<MerchandisingAlertBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render when no fields', () => {
        mockProps.fields = null;
        const { container } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no title', () => {
        mockProps.fields.Title.value = '';
        const { container } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render', () => {
        const { getByText } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(getByText(mockProps.fields.Title.value)).toBeInTheDocument();
    });

    it('should NOT render title', () => {
        mockProps.fields.Title.value = null;
        const { queryByText } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(queryByText('title')).not.toBeInTheDocument();
    });

    it('should render Text', () => {
        const { getByText } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(getByText(mockProps.fields.Text.value)).toBeInTheDocument();
    });

    it('should NOT render Text', () => {
        mockProps.fields.Text.value = null;
        const { queryByText } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(queryByText('description')).not.toBeInTheDocument();
    });

    it('should render Icon', () => {
        const { getByRole } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(getByRole('img')).toBeInTheDocument();
    });

    it('should render Icon', () => {
        mockProps.fields.Icon.value = null;
        const { queryByRole } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(queryByRole('img')).not.toBeInTheDocument();
    });

    it('should Not render Chevrons', () => {
        const { queryByTitle } = render(<MerchandisingAlertBanner {...mockProps} />);

        expect(queryByTitle('ChevronDown')).not.toBeInTheDocument();
        expect(queryByTitle('ChevronUp')).not.toBeInTheDocument();
    });

    describe('Chevron Down should', () => {
        it('render when Screen is mobile & Text has content', () => {
            mockStores.appStore.isScreenMedium = false;
            const { getByTitle } = render(<MerchandisingAlertBanner {...mockProps} />);

            expect(getByTitle('ChevronDown')).toBeInTheDocument();
        });

        it('not render when Screen is mobile & Text has no content', () => {
            mockStores.appStore.isScreenMedium = false;
            mockProps.fields.Text.value = null;
            const { queryByTitle } = render(<MerchandisingAlertBanner {...mockProps} />);

            expect(queryByTitle('ChevronDown')).not.toBeInTheDocument();
        });

        it('toggle more text when clicked', async () => {
            mockStores.appStore.isScreenMedium = false;
            const { getByTitle } = render(<MerchandisingAlertBanner {...mockProps} />);

            await userEvent.click(getByTitle('ChevronDown'));
            expect(getByTitle('ChevronUp')).toBeInTheDocument();
        });
    });

    it('Should track when link is clicked', async () => {
        const { getByTestId } = render(<MerchandisingAlertBanner {...mockProps} />);

        await userEvent.click(getByTestId('link'));
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalled();
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.AlertBannerClicked,
                eventCategory: EventCategories.AlertBanner,
                eventLabel: 'Header',
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            {
                destinationUrl: null,
                genericValue1: 'title',
                genericValue2: 'description',
                genericValue3: 'link',
                genericValue4: null,
            },
        );
    });

    it('Should track when component is visible', () => {
        render(<MerchandisingAlertBanner {...mockProps} />);

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledTimes(1);
    });
});

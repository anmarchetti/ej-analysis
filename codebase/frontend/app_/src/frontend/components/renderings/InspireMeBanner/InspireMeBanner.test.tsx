import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';

import InspireMeBanner, { TInspireMeBannerProps } from './InspireMeBanner';

expect.extend(toHaveNoViolations);

const createProps = (): TInspireMeBannerProps => ({
    fields: {
        Title: mockSitecoreField('unsure about your next travel destination?'),
        Subtitle: mockSitecoreField('Holiday Inspiration'),
        Description: mockSitecoreField('Take our quiz to find the perfect vacation spot that suits you best!'),
        Image: mockSitecoreField(mockSitecoreImageField('src')),
        Link: mockSitecoreField(mockSitecoreLinkField('link', 'Start quiz now')),
    },
    rendering: {},
    params: {},
});

const createStores = () =>
    createMockStores({
        viewBookingStore: {
            booking: mockBooking,
            isCancelledBookingPage: false,
        },
    });

let mockStores = createStores();
let props: TInspireMeBannerProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRichTextWithLinksProps = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='description'>{props.field.value}</div>;
    },
}));

const mockRouterLink = jest.fn();

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLink(props);

        return <div data-tid='router-link' />;
    },
}));

const mockJSSImageNext = jest.fn();

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jssimage' />;
    },
}));

const mockText = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='sitecore-text' />;
    },
}));

describe('<InspireMeBanner />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render the component with title, subtitle, description, image', () => {
        render(<InspireMeBanner {...props} />);
        expect(screen.getByTestId('inspire-me-banner')).toBeInTheDocument();

        expect(mockText).toHaveBeenCalledWith({
            field: props.fields!.Title,
            tag: 'h2',
            className: 'title',
            'data-tid': 'inspire-me-banner-title',
        });
        expect(mockText).toHaveBeenCalledWith({
            field: props.fields!.Subtitle,
            tag: 'h3',
            className: 'subtitle',
            'data-tid': 'inspire-me-banner-subtitle',
        });

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: props.fields!.Description,
            className: 'description',
            dataId: 'inspire-me-banner-description',
        });
    });

    it('should call RouterLink with correct props', () => {
        render(<InspireMeBanner {...props} />);

        expect(mockRouterLink).toHaveBeenCalledWith({
            link: props.fields!.Link,
            className: 'btn link',
            dataId: 'inspire-me-banner-link',
            children: props.fields!.Link.value.text,
        });
    });

    it('should call JSSImageNext with correct props', () => {
        render(<InspireMeBanner {...props} />);

        expect(mockJSSImageNext).toHaveBeenCalledWith({
            field: props.fields!.Image,
            fill: true,
        });
    });

    it('should NOT render when fields is empty', () => {
        props.fields = undefined;

        const { container } = render(<InspireMeBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isCancelledBookingPage is true and booking is from external agency', () => {
        mockStores.viewBookingStore.isCancelledBookingPage = true;
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            isExternalAgency: true,
        };

        const { container } = render(<InspireMeBanner {...props} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT call RouterLink when Link text is empty string', () => {
        props.fields!.Link.value.text = '';

        render(<InspireMeBanner {...props} />);

        expect(mockRouterLink).not.toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<InspireMeBanner {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});

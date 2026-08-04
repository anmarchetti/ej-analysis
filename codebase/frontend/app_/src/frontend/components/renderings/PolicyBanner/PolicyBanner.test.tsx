import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { isDateInRange } from 'frontend/utils/date.utils';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { PolicyBanner } from './PolicyBanner';

jest.mock('frontend/utils/date.utils', () => ({ isDateInRange: jest.fn(() => true), parseDateL10n: jest.fn() }));

const createProps = () => ({
    fields: {
        items: [
            {
                fields: {
                    Title: mockSitecoreField('Title'),
                    Description: mockSitecoreField('Description'),
                    StartDate: mockSitecoreField('2021-01-01'),
                    EndDate: mockSitecoreField('0001-01-01'),
                    Link: mockSitecoreField(mockSitecoreLinkField('href', 'Link', SitecoreLinkType.External)),
                },
            },
        ],
    },
});

const createStores = () => ({
    bookingStore: { booking: { package: { accom: { endDate: '2021-02-02' } } } },
    viewBookingStore: { booking: null },
    queryParamStore: { buildRedirectUrlQuery: jest.fn() },
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PolicyBanner />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores(createStores());
    });

    it('Should render banner', () => {
        render(<PolicyBanner {...props} />);
        expect(screen.getByTestId('policy-banner-container')).toBeInTheDocument();
        expect(screen.getByTestId('policy-banner-container')).toHaveTextContent(
            props.fields.items[0].fields.Title.value,
        );
        expect(screen.getByTestId('policy-banner-container')).toHaveTextContent(
            props.fields.items[0].fields.Description.value,
        );
        expect(screen.getByTestId('policy-banner-link')).toBeInTheDocument();
    });

    it('Should NOT render if NO booking', () => {
        mockStores.bookingStore.booking = null;
        const { container } = render(<PolicyBanner {...props} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render if booking is cancelled', () => {
        mockStores.bookingStore.booking = { bookingStatus: BookingStatus.Canceled };
        const { container } = render(<PolicyBanner {...props} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render if NO fields', () => {
        props.fields = null;
        const { container } = render(<PolicyBanner {...props} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render if booking endDate is not in range', () => {
        (isDateInRange as any).mockReturnValueOnce(false);
        const { container } = render(<PolicyBanner {...props} />);
        expect(container).toBeEmptyDOMElement();
    });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockHotel } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import HotelDropdown, { IHotelDropdownProps } from './HotelDropdown';

const createMockProps = (): IHotelDropdownProps => ({
    hotel: mockHotel,
    CTALabel: mockSitecoreField('CTA'),
    icon: mockSitecoreField(mockSitecoreImageField('icon')),
    title: mockSitecoreField('title'),
    previewClickHandler: jest.fn(),
});

let mockProps;

const mockAmendSummaryAccordionProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAmendSummaryAccordionProps(props);

        return <div data-tid={props.dataTid}>{children}</div>;
    },
}));

const mockHotelPreviewLinkProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/HotelPreviewLink/HotelPreviewLink', () => ({
    __esModule: true,
    default: ({ clickHandler, ...props }) => {
        mockHotelPreviewLinkProps(props);

        return (
            <div data-tid='hotel-preview-link' onClick={clickHandler}>
                {props.children}
            </div>
        );
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: props => {
        mockTextProps(props);

        return <div data-tid='text'>{props.field.value}</div>;
    },
}));

jest.mock('frontend/components/icons/ChevronRight', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-right' />,
}));

describe('<HotelDropdown />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('Should render', () => {
        render(<HotelDropdown {...mockProps} />);

        expect(screen.getByTestId('amend-summary-hotel')).toBeInTheDocument();
        expect(screen.getByTestId('amend-summary-hotel-name')).toHaveTextContent(mockHotel.name!);
        expect(screen.getByTestId('amend-summary-hotel-location')).toHaveTextContent(
            `${mockHotel.resort.name}, ${mockHotel.location.name}`,
        );
        expect(screen.getByTestId('hotel-preview-link')).toBeInTheDocument();
        expect(mockHotelPreviewLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                hotel: mockHotel,
                className: 'link',
            }),
        );
        expect(screen.getByText(mockProps.CTALabel.value)).toBeInTheDocument();
        expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('Should NOT render Hotel Preview Link if field is not passed', () => {
        mockProps.CTALabel = null;
        render(<HotelDropdown {...mockProps} />);

        expect(screen.queryByTestId('hotel-preview-link')).not.toBeInTheDocument();
        expect(screen.queryByText('CTALabel')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });

    it('should call previewClickHandler when it passed', async () => {
        render(<HotelDropdown {...mockProps} />);

        const hotelDropdown = screen.getByTestId('hotel-preview-link');

        await userEvent.click(hotelDropdown);

        expect(mockProps.previewClickHandler).toHaveBeenCalled();
    });
});

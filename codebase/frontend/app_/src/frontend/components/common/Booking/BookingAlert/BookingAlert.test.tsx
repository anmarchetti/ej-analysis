import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import BookingAlert, { TBookingAlertProps } from './BookingAlert';

expect.extend(toHaveNoViolations);

const createProps = (): TBookingAlertProps => ({
    collapseBtnAriaLabel: 'collapse',
    expandBtnAriaLabel: 'expand',
    content: mockSitecoreField('Content'),
    title: mockSitecoreField('Title'),
    isInPopup: false,
});

let props: TBookingAlertProps;

const mockRichTextWithLinkComponent = jest.fn();
const mockChevronDownSvg = jest.fn();
const mockChevronUpSvg = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinkComponent(props);

        return <div dangerouslySetInnerHTML={{ __html: props.field.value }} data-tid={props.dataId} />;
    },
}));

jest.mock('frontend/components/icons-new/ChevronDown', () => ({
    __esModule: true,
    default: props => {
        mockChevronDownSvg(props);

        return <div data-tid='chevron-down-svg' />;
    },
}));

jest.mock('frontend/components/icons-new/ChevronUp', () => ({
    __esModule: true,
    default: props => {
        mockChevronUpSvg(props);

        return <div data-tid='chevron-up-svg' />;
    },
}));

describe('<BookingAlert />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render content with text and cta button', () => {
        render(<BookingAlert {...props} />);

        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(props.title.value);
        expect(screen.getByText(props.content.value)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: props.collapseBtnAriaLabel })).toBeInTheDocument();
    });

    it('should toggle expanded and collapsed states correctly', async () => {
        render(<BookingAlert {...props} />);

        expect(screen.getByTestId('chevron-up-svg')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: props.collapseBtnAriaLabel }));

        expect(screen.getByTestId('chevron-down-svg')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: props.expandBtnAriaLabel })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3 })).not.toHaveClass('titleExpanded');
        expect(mockRichTextWithLinkComponent).toHaveBeenCalledWith(
            expect.objectContaining({ className: expect.not.stringContaining('expanded') }),
        );
    });

    it('should apply inPopup class name for container when inPopup prop is true', async () => {
        props.isInPopup = true;

        render(<BookingAlert {...props} />);

        expect(screen.getByTestId('booking-alert')).toHaveClass('inPopup');
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BookingAlert {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});

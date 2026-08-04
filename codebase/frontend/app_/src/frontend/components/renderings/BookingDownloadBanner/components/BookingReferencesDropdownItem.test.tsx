import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { copyToClipboard } from 'frontend/utils/clipboard.utils';

import BookingReferencesDropdownItem, { TBookingReferencesDropdownItemProps } from './BookingReferencesDropdownItem';

jest.mock('frontend/utils/clipboard.utils', () => ({
    copyToClipboard: jest.fn(),
}));

const createProps = (): TBookingReferencesDropdownItemProps => ({
    description: '',
    title: 'test title',
    refNumber: 'holiday-reference-code-123',
    ariaLabel: 'copy-btn',
    isCopyButtonShown: false,
});

let props: TBookingReferencesDropdownItemProps;

jest.mock('frontend/components/icons-new/ExternalShare', () => ({
    __esModule: true,
    default: () => <span />,
}));

describe('<BookingReferencesDropdownItem />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<BookingReferencesDropdownItem {...props} />);

        expect(screen.getByText(`${props.title}:`)).toBeInTheDocument();
        expect(screen.queryByTestId('booking-ref-item-description')).not.toBeInTheDocument();

        expect(screen.queryByRole('button', { name: props.ariaLabel })).not.toBeInTheDocument();
    });

    it('should render description when it exists', () => {
        props.description = 'test description';

        render(<BookingReferencesDropdownItem {...props} />);

        expect(screen.getByText(props.description)).toBeInTheDocument();
    });

    describe('Copy to buffer button', () => {
        beforeEach(() => {
            props.isCopyButtonShown = true;
        });

        it('should render copy to clipboard button', async () => {
            render(<BookingReferencesDropdownItem {...props} />);

            expect(screen.getByRole('button', { name: props.ariaLabel })).toBeInTheDocument();
        });

        it('should copy booking reference code to clipboard on click', async () => {
            render(<BookingReferencesDropdownItem {...props} />);

            const btn = screen.getByRole('button', { name: props.ariaLabel });

            await userEvent.click(btn);
            expect(copyToClipboard).toHaveBeenCalledWith(props.refNumber);
        });
    });
});

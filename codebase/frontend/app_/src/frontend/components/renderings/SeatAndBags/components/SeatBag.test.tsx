import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import SeatBag from './SeatBag';

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ field, className }) => <div className={className}>JSSImage.{field.value.src}</div>,
}));

describe('<SeatBag />', () => {
    const createProps = () => ({
        text: 'Large bag',
        icon: mockSitecoreField(mockSitecoreImageField('src/icon')),
        count: 3,
    });

    let mockProps;

    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        const { container } = render(<SeatBag {...mockProps} />);

        expect(container.querySelector('.seat-confirmation__bag')).toBeInTheDocument();
        expect(container.querySelector('.seat-confirmation__bag-text')).toHaveTextContent('3 x Large bag');
        expect(screen.getByText(`JSSImage.${mockProps.icon.value.src}`)).toHaveClass('seat-confirmation__bag-icon');
    });

    it('should not render icon if there is NO src', () => {
        mockProps.icon.value.src = undefined;

        render(<SeatBag {...mockProps} />);

        expect(screen.queryByText(`JSSImage.${mockProps.icon.value.src}`)).not.toBeInTheDocument();
    });

    it('should not render text when NO text', () => {
        delete mockProps.text;

        const { container } = render(<SeatBag {...mockProps} />);

        expect(container.querySelector('.seat-confirmation__bag-text')).not.toBeInTheDocument();

        expect(screen.queryByText('3 x Large bag')).not.toBeInTheDocument();
    });

    it('should render text without count when NO count', () => {
        delete mockProps.count;

        const { container } = render(<SeatBag {...mockProps} />);

        expect(container.querySelector('.seat-confirmation__bag-text')).toHaveTextContent('Large bag');
    });
});

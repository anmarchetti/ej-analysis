import { fireEvent, render, screen } from '@testing-library/react';

import GuestDetailsHeader from './GuestDetailsHeader';

describe('<GuestDetailsHeader />', () => {
    it('should render title and icon correctly', () => {
        render(<GuestDetailsHeader title='Guest Details' icon={<span>Icon</span>} />);

        expect(screen.getByText('Guest Details')).toBeInTheDocument();
        expect(screen.getByText('Icon')).toBeInTheDocument();
    });

    it('should render secondary text when provided', () => {
        render(<GuestDetailsHeader title='Guest Details' icon={<span>Icon</span>} secondaryText='Additional Info' />);

        expect(screen.getByText('Additional Info')).toBeInTheDocument();
    });

    it('should NOT render button when disabled', () => {
        render(<GuestDetailsHeader title='Guest Details' icon={<span>Icon</span>} disabled={true} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should toggle isExpanded state when button is clicked', () => {
        const onClick = jest.fn();

        render(<GuestDetailsHeader title='Guest Details' icon={<span>Icon</span>} onClick={onClick} />);

        fireEvent.click(screen.getByRole('button'));

        expect(onClick).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'click',
            }),
        );
    });

    it('should apply expanded class when isExpanded is true', () => {
        const { container } = render(
            <GuestDetailsHeader title='Guest Details' icon={<span>Icon</span>} isExpanded={true} />,
        );

        expect(container.querySelector('.expanded')).toBeInTheDocument();
    });
});

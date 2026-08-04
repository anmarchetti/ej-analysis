import { render, screen } from '@testing-library/react';

import ErrorMessage from './ErrorMessage';

describe('<ErrorMessage />', () => {
    it('should not render if error prop is not provided', () => {
        const { container } = render(<ErrorMessage />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render error message and warning icon when error prop is provided', () => {
        const errorText = 'This field is required';
        render(<ErrorMessage error={errorText} />);

        const alert = screen.getByTestId('error-message');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(errorText);
        expect(alert.querySelector('svg')).toBeInTheDocument();
    });
});

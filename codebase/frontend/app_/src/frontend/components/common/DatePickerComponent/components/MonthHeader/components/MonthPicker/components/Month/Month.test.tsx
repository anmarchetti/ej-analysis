import { render, screen } from '@testing-library/react';

import Month from './Month';

jest.mock('dayjs', () => ({
    __esModule: true,
    default: {
        monthsShort: () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    },
}));

describe('Month', () => {
    it('should render month', () => {
        render(<Month month={4} />);

        expect(screen.getByText('May')).toBeInTheDocument();
    });
});

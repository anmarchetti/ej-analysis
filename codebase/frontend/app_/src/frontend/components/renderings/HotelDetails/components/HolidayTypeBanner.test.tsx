import * as React from 'react';
import { render, screen } from '@testing-library/react';

import HolidayTypeBanner from './HolidayTypeBanner';

jest.mock('frontend/components/common/JSSImage', () => jest.fn(() => <img data-tid='jss-image' alt='' />));

describe('<HolidayTypeBanner />', () => {
    const resetMocks = () => ({
        type: { description: '', filledIcon: 'test-icon-src' } as any,
        theme: {} as any,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render the main banner structure and description by default', () => {
        mocks.type.description = 'Test Description';
        render(<HolidayTypeBanner {...mocks} />);

        const section = screen.getByRole('region', { name: 'Holiday Type Banner' });
        expect(section).toHaveClass('holiday-type-banner');

        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render JSSImage with correct src if type.filledIcon is provided', () => {
        render(<HolidayTypeBanner {...mocks} />);

        const imageElement = screen.getByTestId('jss-image');
        expect(imageElement).toBeInTheDocument();
    });

    it('should NOT render JSSImage if type.filledIcon is not provided (e.g., undefined)', () => {
        mocks.type.filledIcon = undefined;

        render(<HolidayTypeBanner {...mocks} />);

        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
    });

    it('should render typeAndThemeTitle if typeAndThemeTitle received', () => {
        const testText = 'Great for families';
        mocks.type.typeAndThemeTitle = testText;
        render(<HolidayTypeBanner {...mocks} />);

        expect(screen.getByText(testText)).toBeInTheDocument();
    });
});

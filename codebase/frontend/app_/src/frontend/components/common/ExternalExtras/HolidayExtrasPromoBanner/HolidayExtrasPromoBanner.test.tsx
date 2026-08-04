import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import HolidayExtrasPromoBanner, { IHolidayExtrasPromoBannerProps } from './HolidayExtrasPromoBanner';

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('HolidayExtrasPromoBanner', () => {
    const mockProps: IHolidayExtrasPromoBannerProps = {
        promotionText: mockSitecoreField('Promo Text'),
        promotionLogo: mockSitecoreField(mockSitecoreImageField('Image')),
    };

    it('should render fields when provided', () => {
        render(<HolidayExtrasPromoBanner {...mockProps} />);

        expect(screen.getByTestId('promotion-text-title')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
    });
});

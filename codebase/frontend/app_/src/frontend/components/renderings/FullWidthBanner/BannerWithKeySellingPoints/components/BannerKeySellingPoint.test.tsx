import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import BannerKeySellingPoint, { IBannerKeySellingPointProps } from './BannerKeySellingPoint';

const createProps = (): IBannerKeySellingPointProps => ({
    Label: mockSitecoreField('Test Label'),
    Icon: mockSitecoreField(mockSitecoreImageField('test-icon')),
    className: 'test-class',
});

let mockProps: IBannerKeySellingPointProps;

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext.tsx', () => ({
    __esModule: true,
    default: () => <div data-tid='jss-image-next' />,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='jss-text'>{field.value}</div>,
}));

describe('<BannerKeySellingPoint />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<BannerKeySellingPoint {...mockProps} />);

        expect(screen.getByTestId('jss-text')).toHaveTextContent('Test Label');
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByTestId('banner-key-selling-point-item')).toHaveClass('wrapper test-class');
    });
});

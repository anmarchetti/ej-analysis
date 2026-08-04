import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { IMerchandisingBannerProps, MerchandisingBanner } from './MerchandisingBanner';

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn(url => url),
    },
}));

describe('<MerchandisingBanner />', () => {
    const resetMocks = () => ({
        fields: {
            Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
            Label: mockSitecoreField('Label'),
        },
        isEditMode: false,
        params: {},
        rendering: {},
    });

    let mocks: IMerchandisingBannerProps = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should be empty render if there are not fields', () => {
        mocks.fields = undefined;
        render(<MerchandisingBanner {...mocks} />);

        expect(screen.queryByTestId('merchandising-banner')).not.toBeInTheDocument();
    });

    it("Should be empty render if label is empty and it's not edit mode", () => {
        mocks.fields!.Label.value = '';
        render(<MerchandisingBanner {...mocks} />);

        expect(screen.queryByTestId('merchandising-banner')).not.toBeInTheDocument();
    });

    it('Should standart render', () => {
        render(<MerchandisingBanner {...mocks} />);

        expect(screen.getByTestId('merchandising-banner')).toBeInTheDocument();
        expect(screen.getByTestId('merchandising-banner-icon')).toBeInTheDocument();
        expect(screen.getByTestId('merchandising-banner-icon').style.backgroundImage).toBe('url(Icon)');
        expect(screen.getByTestId('merchandising-banner')).toHaveTextContent(mocks.fields!.Label.value);
    });

    it('Should render in edit mode even if label is empty', () => {
        mocks.isEditMode = true;
        mocks.fields!.Label.value = '';
        render(<MerchandisingBanner {...mocks} />);

        expect(screen.getByTestId('merchandising-banner')).toBeInTheDocument();
        expect(screen.getByTestId('merchandising-banner-icon')).toBeInTheDocument();
    });
});

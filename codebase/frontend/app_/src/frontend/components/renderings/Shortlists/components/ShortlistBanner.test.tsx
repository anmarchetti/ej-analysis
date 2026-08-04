import React from 'react';
import { act, render, waitFor } from '@testing-library/react';

import { cmsUrls } from 'code/endpoints';
import { getImage } from 'frontend/utils/getImage';
import { IImage } from 'models/data/IHotel';
import { ImageSize } from 'models/enum/ImageSize';

import ShortlistBanner from './ShortlistBanner';

jest.mock('frontend/utils/getImage');
jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn(url => url),
    },
}));

const createProps = () => ({
    title: { value: 'title' },
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), getBreadcrumb: jest.fn() },
    shortlistStore: {
        prevPageBreadcrumb: null,
        savePrevPage: jest.fn(),
        shortlistHeroImage: null as any,
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => () => (
    <div data-tid='destination-breadcrumbs' />
));

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: () => <div data-tid='jss-image-next' />,
}));

describe('<ShortlistBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render path breadcrumbs', () => {
        const { getByTestId } = render(<ShortlistBanner {...mockProps} />);

        expect(getByTestId('destination-breadcrumbs')).toBeInTheDocument();
    });

    it('should render title', () => {
        const { getByRole } = render(<ShortlistBanner {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
    });

    it('should NOT render title when title is NOT provided', () => {
        mockProps.title = null;
        const { queryByRole } = render(<ShortlistBanner {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should set image url when image is provided', async () => {
        const mockImageUrl = 'test-image-url';
        (getImage as jest.Mock).mockResolvedValue(mockImageUrl);
        mockStores.shortlistStore.shortlistHeroImage = {
            small: 'small',
            medium: 'medium',
            large: 'large',
        } as IImage;

        render(<ShortlistBanner {...mockProps} />);

        await act(async () => {
            await waitFor(() => {
                expect(getImage).toHaveBeenCalledWith(mockStores.shortlistStore.shortlistHeroImage, ImageSize.Large);
                expect(cmsUrls.media).toHaveBeenCalledWith(mockImageUrl);
            });
        });
    });

    it('should NOT set image url when no image is provided', async () => {
        render(<ShortlistBanner {...mockProps} />);

        await act(async () => {
            await waitFor(() => {
                expect(getImage).not.toHaveBeenCalled();
            });
        });
    });
});

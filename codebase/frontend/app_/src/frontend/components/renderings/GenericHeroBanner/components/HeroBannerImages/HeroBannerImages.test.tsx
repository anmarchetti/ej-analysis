import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import HeroBannerImages, { IHeroBannerImagesProps } from './HeroBannerImages';

let mockStores;
let mockProps: IHeroBannerImagesProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

const mockImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: props => {
        mockImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

jest.mock('frontend/hooks/useMediaQuery');

describe('<HeroBannerImages />', () => {
    beforeAll(() => {
        jest.mocked(useMobileViewport).mockReturnValue(false);
    });

    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            image: mockSitecoreField(mockSitecoreImageField('Image')),
            mobileImage: mockSitecoreField(mockSitecoreImageField('MobileOnlyImage')),
        };
    });

    it('should render JSSImageNext', () => {
        render(<HeroBannerImages {...mockProps} />);

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith({
            fill: true,
            field: mockProps.image,
            className: 'hero-banner__image',
            priority: true,
        });
    });

    it('should render JSSImageNext on mobile', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);

        render(<HeroBannerImages {...mockProps} />);

        expect(mockJSSNextImageProps).toHaveBeenCalledWith({
            fill: true,
            field: mockProps.mobileImage,
            className: 'hero-banner__image',
            priority: true,
        });
    });

    it('Should render JSSImage in Edit mode', () => {
        mockStores.layoutStore.isEditMode = true;

        render(<HeroBannerImages {...mockProps} />);

        expect(screen.queryByTestId('jss-next-image')).not.toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockImageProps).toHaveBeenCalledWith({ field: mockProps.image });
    });
});

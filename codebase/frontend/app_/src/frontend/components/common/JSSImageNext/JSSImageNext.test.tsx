import React from 'react';
import { render, screen } from '@testing-library/react';

import { cmsUrls } from 'code/endpoints';
import { useMobileViewport, useTabletViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';

import JSSImageNext, { TJSSImageProps } from './JSSImageNext';
import { getDynamicImageSizes, getDynamicMediaSize } from './JSSImageNext.utils';

const createProps = (): Partial<TJSSImageProps> => ({
    field: mockSitecoreField(mockSitecoreImageField('image')),
});

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
    },
});

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Image: () => <div data-tid='sitecore-image' />,
}));

jest.mock('frontend/components/common/JSSImageNext/getImageStyles', () => ({
    getImageStyles: jest.fn().mockReturnValue({
        inlineStyles: {
            objectPosition: undefined,
            objectFit: 'cover',
        },
        styles: undefined,
        className: undefined,
    }),
}));

const mockImageComponent = jest.fn();
jest.mock('frontend/components/common/AppImage', () => ({
    __esModule: true,
    default: props => {
        mockImageComponent(props);

        return <div data-tid='image' />;
    },
}));

jest.mock('frontend/hooks/useMediaQuery');
jest.mock('./JSSImageNext.utils');

let props;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<JSSImageNext />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        jest.mocked(useMobileViewport).mockReturnValue(false);
        jest.mocked(useTabletViewport).mockReturnValue(false);
    });

    it('Should not render image', async () => {
        props.field = null;
        const { container } = render(<JSSImageNext {...props} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should render sitecore image in edit mode', async () => {
        mockStores.layoutStore.isEditMode = true;
        render(<JSSImageNext {...props} />);
        expect(screen.getByTestId('sitecore-image')).toBeInTheDocument();
        expect(screen.queryByTestId('image')).not.toBeInTheDocument();
    });

    it('Should render Image with mediaSize props', async () => {
        props.mediaSize = MediaSize.Large;
        jest.mocked(getDynamicMediaSize).mockReturnValueOnce(MediaSize.Large);

        render(<JSSImageNext {...props} />);

        expect(mockImageComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                src: 'image?mw=1920&mh=1080',
            }),
        );
    });

    it('Should pass minimumMediaSize to getDynamicMediaSize', async () => {
        props.minimumMediaSize = MediaSize.Medium;
        jest.mocked(getDynamicMediaSize).mockReturnValueOnce(MediaSize.Medium);

        render(<JSSImageNext {...props} />);

        expect(getDynamicMediaSize).toHaveBeenCalledWith(undefined, false, false, MediaSize.Medium);
    });

    it('Should not render image if no src', async () => {
        props.field.value.src = '';
        const { container } = render(<JSSImageNext {...props} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should render Image with calculated styles', async () => {
        const spy = jest.spyOn(cmsUrls, 'media');
        render(<JSSImageNext {...props} />);

        expect(spy).toHaveBeenCalledWith('image', undefined);
        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(mockImageComponent).toHaveBeenCalledWith({
            alt: '',
            className: '',
            height: undefined,
            width: undefined,
            priority: undefined,
            src: 'image',
            style: { objectFit: 'cover', objectPosition: undefined },
        });
    });

    it('Should render Image with fill prop', async () => {
        props.fill = true;
        render(<JSSImageNext {...props} />);

        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(mockImageComponent).toHaveBeenCalledWith({
            alt: '',
            className: '',
            fill: true,
            priority: undefined,
            src: 'image',
            style: { objectFit: 'cover', objectPosition: undefined },
        });
    });

    it('Should NOT be rendered when field has no value', () => {
        props.field.value = undefined;
        const { container } = render(<JSSImageNext {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Should be rendered with dynamicSize prop', () => {
        it('Should be rendered with appropriate sizes', () => {
            props.dynamicSize = { desktop: { width: 13, height: 15 }, mobile: { width: 23, height: 25 } };
            jest.mocked(getDynamicImageSizes).mockReturnValue(props.dynamicSize.mobile);

            render(<JSSImageNext {...props} />);

            expect(mockImageComponent).toHaveBeenCalledWith(expect.objectContaining(props.dynamicSize.mobile));
            expect(getDynamicImageSizes).toHaveBeenCalledWith(props.dynamicSize, false, false);
        });

        it('Should be rendered with default sizes when getDynamicImageSizes return nothing', () => {
            props.dynamicSize = { desktop: { width: 13, height: 15 }, mobile: { width: 23, height: 25 } };
            props.width = 13;
            props.height = 13;
            jest.mocked(getDynamicImageSizes).mockReturnValue(undefined);

            render(<JSSImageNext {...props} />);

            expect(mockImageComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    width: 13,
                    height: 13,
                }),
            );
            expect(getDynamicImageSizes).toHaveBeenCalledWith(props.dynamicSize, false, false);
        });
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import * as imageUtils from 'frontend/utils/getImage';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { JSSImage } from './JSSImage';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Image: () => <div data-tid='jss-image' />,
}));

const createProps = () => ({
    field: mockSitecoreField({ src: 'src', alt: 'alt', width: 150, height: 50 }),
    dataTid: 'data-test-id',
});

const createStores = () => ({
    layoutStore: { isEditMode: false },
    appStore: { isScreenLessMedium: false },
});

let props;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/getImage', () => ({
    getImageFocalPointStyles: jest.fn().mockReturnValue(undefined),
}));

describe('<JSSImage />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should NOT render when fields is NOT provided', () => {
        props.field = undefined;

        const { container } = render(<JSSImage {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when src is NOT provided and isEditMode is false', () => {
        props.field.value.src = null;

        const { container } = render(<JSSImage {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render img tag when getImageFocalPointStyles does NOT return styles', () => {
        render(<JSSImage {...props} />);

        expect(screen.getByRole('img')).toHaveAttribute('src', 'src');
    });

    it('should render without srcSet prop', () => {
        (imageUtils.getImageFocalPointStyles as any).mockReturnValueOnce({ background: 'none' });

        render(<JSSImage {...props} />);

        expect(screen.getByTestId('data-test-id')).toHaveAttribute('style', 'background: none;');
    });

    it('Should render image without src in Edit Mode', () => {
        props.field.value.src = null;
        mockStores.layoutStore.isEditMode = true;

        render(<JSSImage {...props} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
    });

    it('should render with empty alt when alt is NOT provided', () => {
        delete props.field.value.alt;

        render(<JSSImage {...props} />);

        expect(screen.getByRole('img')).toHaveAttribute('alt', '');
    });

    describe('aspect-ratio', () => {
        it('should not apply aspect-ratio style when width is missing', () => {
            props.field.value.width = '';

            const { container } = render(<JSSImage {...props} />);

            const img = container.querySelector('img');

            expect(img?.style.aspectRatio).toBeUndefined();
        });

        it('should not apply aspect-ratio style when height is missing', () => {
            props.field.value.height = '';

            const { container } = render(<JSSImage {...props} />);

            const img = container.querySelector('img');

            expect(img?.style.aspectRatio).toBeUndefined();
        });

        it('should apply aspect-ratio style when we have width and height', () => {
            const { container } = render(<JSSImage {...props} />);

            const img = container.querySelector('img');

            expect(img?.style.aspectRatio).not.toBeUndefined();
        });
    });
});

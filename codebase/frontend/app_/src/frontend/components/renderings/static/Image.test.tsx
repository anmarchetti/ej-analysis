import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { MediaSize } from 'models/data/MediaSizeParams';

import { Image } from './Image';

jest.mock('frontend/utils/getImage');

let mockStores;

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

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockRouterLinkProps(props);

        return <div data-tid='router-link'>{children}</div>;
    },
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<Image />', () => {
    const resetMocks = () => ({
        fields: {
            Url: {
                value: { href: 'href', text: 'text', linktype: {} as any },
            },
            Image: { value: { src: 'src' } },
            Link: undefined as any,
        },
        rendering: {} as any,
        params: {} as any,
        width: 64,
        height: 64,
        fill: true,
        mediaSize: MediaSize.Large,
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({});
    });

    it('Should empty render', () => {
        delete mocks.fields;
        const { container } = render(<Image {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render without link', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<Image {...mocks} />);

        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mocks.fields.Image,
            }),
        );
    });

    it('Should render with link and image', () => {
        render(<Image {...mocks} />);

        expect(screen.getByTestId('router-link')).toBeInTheDocument();
        expect(mockRouterLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                link: mocks.fields.Url,
            }),
        );

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mocks.fields.Image,
                width: mocks.width,
                height: mocks.height,
                fill: mocks.fill,
                mediaSize: mocks.mediaSize,
            }),
        );
    });

    it('Should render RouterLink with Link field', () => {
        delete mocks.fields.Url;
        mocks.fields.Link = { value: { href: 'href', text: 'text', linktype: {} as any } };
        render(<Image {...mocks} />);

        expect(mockRouterLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                link: mocks.fields.Link,
            }),
        );
    });
});

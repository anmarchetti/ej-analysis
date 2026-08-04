import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';

import SocialIcons from './SocialIcons';

const resetMocks = () =>
    ({
        fields: {
            items: [
                {
                    id: '1',
                    fields: {
                        Image: { value: mockSitecoreImageField('image-1.png') },
                        Link: { value: { href: 'test-1', text: 'text-1' } },
                    },
                },
                {
                    id: '2',
                    fields: {
                        Image: { value: mockSitecoreImageField('image-2.png') },
                        Link: { value: { href: 'test-2', text: 'text-2' } },
                    },
                },
            ],
        },
    } as any);

const createStores = () =>
    createMockStores({
        trackingStore: {
            trackHomepageAction: jest.fn(),
        },
        layoutStore: {
            sitePath: 'sitePath',
        },
        queryParamStore: {
            buildRedirectUrlQuery: jest.fn(),
        },
    });

let mockProps;
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

jest.mock('frontend/components/common/RouterLink', () => (props: any) => (
    <a data-tid='router-link' className={props.className} href={props.to}>
        {props.children}
    </a>
));

describe('<SocialIcons />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createStores();
        mockJSSNextImageProps.mockClear();
    });

    it('should render JSSImageNext component', () => {
        render(<SocialIcons {...mockProps} />);
        expect(screen.getAllByTestId('jss-next-image')).toHaveLength(2);

        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.items[0].fields.Image,
                width: 24,
                height: 24,
                mediaSize: MediaSize.Small,
            }),
        );

        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.items[1].fields.Image,
                width: 24,
                height: 24,
                mediaSize: MediaSize.Small,
            }),
        );
    });

    it('should render image links', () => {
        const { container } = render(<SocialIcons {...mockProps} />);
        const links = container.querySelectorAll('[data-tid="router-link"]');
        expect(links).toHaveLength(2);
    });

    it('should be empty render when no fields', () => {
        mockProps.fields = null;
        const { container } = render(<SocialIcons {...mockProps} />);
        expect(container.firstChild).toBeNull();
    });

    it('should be empty render when no links with href', () => {
        mockProps.fields.items = [
            {
                id: '1',
                fields: {
                    Image: { value: mockSitecoreImageField('image-1.png') },
                    Link: { value: { href: '', text: '' } },
                },
            },
        ];
        const { container } = render(<SocialIcons {...mockProps} />);
        expect(container.firstChild).toBeNull();
    });
});

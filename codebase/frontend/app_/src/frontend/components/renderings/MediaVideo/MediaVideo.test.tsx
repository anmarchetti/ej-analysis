import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import useShouldRenderVideo from 'frontend/hooks/useShouldRenderVideo';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { MediaVideo, TMediaVideoProps } from './MediaVideo';

const createStores = () => ({
    appStore: {
        isScreenLessMedium: false,
    },
    layoutStore: {
        isEditMode: false,
    },
});

const createProps = (): TMediaVideoProps => ({
    fields: {
        IsFullScreenAvailable: mockSitecoreField(true),
        IsHoverEffectEnabled: mockSitecoreField(true),
        IsMuted: mockSitecoreField(false),
        PlayIcon: mockSitecoreField(mockSitecoreImageField('icon-image')),
        Preview: mockSitecoreField(mockSitecoreImageField('preview-image')),
        ShowPreviewOnMobile: mockSitecoreField(false),
        YouTubeVideoCode: mockSitecoreField('code'),
    },
    params: {
        ClassName: '',
    },
    rendering: {},
});

let props;
let mockStores;

const mockJSSImageComponent = jest.fn();

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageComponent(props);

        return (
            <div data-tid='image'>{props.onClick && <button onClick={() => props.onClick()}>image-button</button>}</div>
        );
    },
}));

jest.mock('frontend/hooks/useShouldRenderVideo');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<MediaVideo />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        (useShouldRenderVideo as any).mockReturnValue(true);
    });

    it('should default render', () => {
        render(<MediaVideo {...props} />);

        const iframeAttrs = screen.getByTestId('media-video-iframe').getAttribute('src');
        const containerClassNames = screen.getByTestId('media-video-iframe-container').getAttribute('class');

        expect(iframeAttrs).toBe('https://www.youtube.com/embed/code?autoplay=0&mute=0');
        expect(containerClassNames).toBe('container hoverAnimation');
        expect(screen.getByRole('button', { name: 'image-button' })).toBeInTheDocument();
    });

    it('should set custom class name from params', () => {
        props.params.ClassName = 'my-class-name';

        render(<MediaVideo {...props} />);

        expect(screen.getByTestId('media-video-iframe-container')).toHaveClass('my-class-name');
    });

    it('should not set custom class name when it is not in params', () => {
        props.params = {};

        render(<MediaVideo {...props} />);

        expect(screen.getByTestId('media-video-iframe-container').getAttribute('class')).toBe(
            'container hoverAnimation',
        );
    });

    it('should render a muted video when IsMuted field has true value', () => {
        props.fields.IsMuted.value = true;

        render(<MediaVideo {...props} />);

        const iframeAttrs = screen.getByTestId('media-video-iframe').getAttribute('src');

        expect(iframeAttrs).toBe('https://www.youtube.com/embed/code?autoplay=0&mute=1');
    });

    it('should NOT render the component when useShouldRenderVideo hook returns false', () => {
        (useShouldRenderVideo as any).mockReturnValue(false);

        const { container } = render(<MediaVideo {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render the component when there are no fields', () => {
        props.fields = undefined;

        const { container } = render(<MediaVideo {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render iframe without embedCode', () => {
        props.fields.YouTubeVideoCode = undefined;

        render(<MediaVideo {...props} />);

        expect(screen.queryByTestId('media-video-iframe')).not.toBeInTheDocument();
    });

    it('should NOT to add hover animation for preview image on mobile devices when  is false and', () => {
        mockStores.appStore.isScreenLessMedium = true;

        render(<MediaVideo {...props} />);

        const containerClassNames = screen.getByTestId('media-video-iframe-container').getAttribute('class');

        expect(containerClassNames).toBe('container');
    });

    describe('check the preview image and the play button', () => {
        it('should hide a preview when PlayIcon button was clicked', async () => {
            render(<MediaVideo {...props} />);

            await userEvent.click(screen.getByRole('button', { name: 'image-button' }));

            expect(screen.queryAllByTestId('image')).toHaveLength(0);
        });

        it('should NOT render a preview when Preview does not have scr value', () => {
            props.fields.Preview.value.src = '';

            render(<MediaVideo {...props} />);

            expect(mockJSSImageComponent).not.toBeCalled();
        });

        it('should NOT render a preview when PlayIcon does not have scr value', () => {
            props.fields.PlayIcon.value.src = '';

            render(<MediaVideo {...props} />);

            expect(mockJSSImageComponent).not.toBeCalled();
        });
    });

    describe('edit mode', () => {
        beforeEach(() => {
            mockStores.layoutStore.isEditMode = true;
        });

        it('should render a preview with only fields on edit mode', () => {
            render(<MediaVideo {...props} />);

            expect(mockJSSImageComponent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    field: props.fields.PlayIcon,
                }),
            );

            expect(mockJSSImageComponent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    field: props.fields.Preview,
                }),
            );

            expect(screen.queryByRole('button', { name: 'image-button' })).not.toBeInTheDocument();
        });
    });
});

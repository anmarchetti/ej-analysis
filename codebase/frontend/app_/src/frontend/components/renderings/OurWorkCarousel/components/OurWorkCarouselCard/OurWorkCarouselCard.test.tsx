import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import OurWorkCarouselCard, { IOurWorkCarouselCardProps } from './OurWorkCarouselCard';

const createProps = (): IOurWorkCarouselCardProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
        Image: mockSitecoreField(mockSitecoreImageField('image', 'imageDescription')),
        Link: mockSitecoreField(mockSitecoreLinkField('link', 'linkText', SitecoreLinkType.External)),
    },
});

const mockJSSImageComponent = jest.fn();
const mockRouterLinkComponent = jest.fn();
let props;

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageComponent(props);

        return <div data-tid='image' />;
    },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkComponent(props);

        return <div data-tid='router-link'>{props.children}</div>;
    },
}));

describe('<OurWorkCarouselCard />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<OurWorkCarouselCard {...props} />);

        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
        expect(screen.getByTestId('carousel-card-subtitle')).toHaveTextContent('Subtitle');
        expect(screen.getByTestId('carousel-card-link-icon')).toBeInTheDocument();
        expect(mockJSSImageComponent).toBeCalledWith(
            expect.objectContaining({
                role: 'presentation',
                field: {
                    value: {
                        alt: 'imageDescription',
                        src: 'image',
                    },
                },
            }),
        );

        expect(mockRouterLinkComponent).toBeCalledWith(
            expect.objectContaining({
                link: {
                    value: {
                        href: 'link',
                        linktype: SitecoreLinkType.External,
                        text: 'linkText',
                    },
                },
            }),
        );
    });

    it('should not render image when it is undefined in sitecore', () => {
        props.fields.Image = undefined;

        render(<OurWorkCarouselCard {...props} />);

        expect(mockJSSImageComponent).not.toBeCalled();
    });

    it('should not render link when it is undefined in sitecore', () => {
        props.fields.Link = undefined;

        render(<OurWorkCarouselCard {...props} />);

        expect(screen.queryByTestId('carousel-card-link-icon')).not.toBeInTheDocument();
        expect(mockRouterLinkComponent).not.toBeCalled();
    });

    it('should not render without sitecore fields', () => {
        props.fields = undefined;

        const { container } = render(<OurWorkCarouselCard {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should set the height of the title wrapper correctly', () => {
        props.titleHeight = 10;

        render(<OurWorkCarouselCard {...props} />);

        expect(screen.getByTestId('carousel-card-title-wrapper')).toHaveAttribute('style', 'height: 10px;');
    });

    it('should NOT set zero height of the title wrapper when titleHeight prop is zero', () => {
        props.titleHeight = 0;

        render(<OurWorkCarouselCard {...props} />);

        expect(screen.getByTestId('carousel-card-title-wrapper')).not.toHaveAttribute('style');
    });

    it('should NOT set any height value of the title wrapper when titleHeight prop is not defined', () => {
        props.titleHeight = undefined;

        render(<OurWorkCarouselCard {...props} />);

        expect(screen.getByTestId('carousel-card-title-wrapper')).not.toHaveAttribute('style');
    });
});

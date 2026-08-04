import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import {
    IPromoBlockItemSmallProps,
    PromoBlockItemSmall,
} from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/components/PromoBlockItemSmall/PromoBlockItemSmall';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => (
    <div data-tid='rich-text-with-links'>{field.value}</div>
));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ onClick, children, className, ariaLabel, ...props }) => {
        mockRouterLinkProps(props);

        return (
            <div data-tid='router-link' className={className} aria-label={ariaLabel} onClick={onClick}>
                {children}
            </div>
        );
    },
}));

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
    },
});

const mockTrackItemClick = jest.fn();
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ trackItemClick: mockTrackItemClick }),
}));

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: (callback: any) => callback(mockStores),
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field, className, 'data-tid': dataTid }) => (
        <div data-tid={dataTid} className={className}>
            {field?.value}
        </div>
    ),
}));

const resetMocks = (): IPromoBlockItemSmallProps => ({
    item: {
        fields: {
            Title: mockSitecoreField('title'),
            Description: mockSitecoreField('description'),
            Image: mockSitecoreField(mockSitecoreImageField('test')),
            Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
        },
        id: 'test',
    } as IPromoBlockFields,
    onClick: jest.fn(),
    itemClass: 'test-class',
    titleClassName: 'titleClassName',
});

let mockProps: IPromoBlockItemSmallProps;
let mockStores;

describe('<PromoBlockItemSmall />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createStores();
    });

    it('should render standard', () => {
        render(<PromoBlockItemSmall {...mockProps} />);

        expect(screen.getByTestId('promo-block-image')).toBeInTheDocument();
        expect(screen.getByText(mockProps.item.fields.Title.value)).toHaveClass('title');
        expect(screen.getByText(mockProps.item.fields.Description.value)).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(screen.getByTestId('router-link')).toBeInTheDocument();

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.item.fields.Image,
                className: 'image',
                fill: true,
                mediaSize: {
                    desktop: MediaSize.Big,
                },
            }),
        );
        expect(mockRouterLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataId: 'promo-block',
            }),
        );
    });

    it('should render with special classNames when isEditMode enabled', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<PromoBlockItemSmall {...mockProps} />);

        expect(screen.getByTestId('router-link')).toBeInTheDocument();
    });

    it('should render Title when isEditMode enabled', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<PromoBlockItemSmall {...mockProps} />);

        expect(screen.getByTestId('promo-block-title')).toBeInTheDocument();
    });

    describe('link aria-label', () => {
        it('should use link text value as aria-label when it is defined', () => {
            render(<PromoBlockItemSmall {...mockProps} />);

            expect(screen.getByTestId('router-link')).toBeInTheDocument();
            expect(screen.getByTestId('router-link')).toHaveAttribute(
                'aria-label',
                mockProps.item.fields.Link.value.text,
            );
        });

        it('should use link href value as aria-label when link text is not defined', () => {
            mockProps.item.fields.Link.value = { ...mockProps.item.fields.Link.value, text: undefined as any };

            render(<PromoBlockItemSmall {...mockProps} />);

            expect(screen.getByTestId('router-link')).toBeInTheDocument();
            expect(screen.getByTestId('router-link')).toHaveAttribute(
                'aria-label',
                mockProps.item.fields.Link.value.href,
            );
        });
    });

    it('should NOT render link when it is not defined', () => {
        mockProps.item.fields.Link = mockSitecoreField(mockSitecoreLinkField());
        render(<PromoBlockItemSmall {...mockProps} />);

        expect(screen.getByTestId('promo-block')).toBeInTheDocument();
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
    });

    it('should NOT render title when it is not defined', () => {
        mockProps.item.fields.Title = mockSitecoreField('');
        render(<PromoBlockItemSmall {...mockProps} />);

        expect(screen.queryByTestId('promo-block-title')).not.toBeInTheDocument();
    });

    it('should render button wrapper when no link and call handleClick methods on click', async () => {
        mockProps.item.fields.Link = mockSitecoreField(mockSitecoreLinkField());

        const { container } = render(<PromoBlockItemSmall {...mockProps} />);

        const buttonElement = screen.getByRole('button');

        expect(container.firstChild).toBeInstanceOf(HTMLButtonElement);
        expect(buttonElement).toHaveClass('test-class');
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();

        await userEvent.click(buttonElement);

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockTrackItemClick).toHaveBeenCalled();
    });

    it('should render RouterLink wrapper when link is defined and call handleClick methods on click', async () => {
        render(<PromoBlockItemSmall {...mockProps} />);

        const linkElement = screen.getByTestId('router-link');

        expect(linkElement).toBeInTheDocument();

        await userEvent.click(linkElement);

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockTrackItemClick).toHaveBeenCalled();
    });
});

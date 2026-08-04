import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { BigVariantTitlePlacementOptions } from 'models/enum/PromoBlocksBigVariantParams';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { IPromoBlockItemBigProps, PromoBlockItemBig } from './PromoBlockItemBig';

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

jest.mock('./components/PromoBlockItemBigPill', () => ({
    __esModule: true,
    default: () => <div data-tid='pill-component' />,
}));

const resetMocks = (): IPromoBlockItemBigProps => ({
    item: {
        fields: {
            Title: mockSitecoreField('title'),
            Description: mockSitecoreField('description'),
            Image: mockSitecoreField(mockSitecoreImageField('test')),
            Link: mockSitecoreField(mockSitecoreLinkField('test', 'link', SitecoreLinkType.Internal)),
            CTAText: mockSitecoreField(''),
            PillText: mockSitecoreField('Pill text'),
            PillPrice: mockSitecoreField('123'),
        },
        id: 'test',
    } as IPromoBlockFields,
    onClick: jest.fn(),
    itemClass: 'test-class',
    titlePlacement: BigVariantTitlePlacementOptions.TitleBelowImage,
    titleClassName: 'titleClassName',
});

let mockProps: IPromoBlockItemBigProps;
let mockStores;

describe('<PromoBlockItemBig />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createStores();
    });

    it('should render standard', () => {
        render(<PromoBlockItemBig {...mockProps} />);

        expect(screen.getByTestId('promo-block-image')).toBeInTheDocument();
        expect(screen.getByText(mockProps.item.fields.Title.value)).toHaveClass('title');
        expect(screen.queryByTestId('promo-block-pill')).not.toBeInTheDocument();
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
                link: mockProps.item.fields.Link,
            }),
        );
    });

    it('should render Title and Pill when isEditMode enabled', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<PromoBlockItemBig {...mockProps} />);

        expect(screen.getByTestId('promo-block-title')).toBeInTheDocument();
        expect(screen.getByTestId('pill-component')).toBeInTheDocument();
    });

    describe('link aria-label', () => {
        it('should use link text value as aria-label when it is defined', () => {
            render(<PromoBlockItemBig {...mockProps} />);

            expect(screen.getByTestId('router-link')).toBeInTheDocument();
            expect(screen.getByTestId('router-link')).toHaveAttribute(
                'aria-label',
                mockProps.item.fields.Link.value.text,
            );
        });

        it('should use link href value as aria-label when link text is not defined', () => {
            mockProps.item.fields.Link.value = { ...mockProps.item.fields.Link.value, text: undefined as any };

            render(<PromoBlockItemBig {...mockProps} />);

            expect(screen.getByTestId('router-link')).toBeInTheDocument();
            expect(screen.getByTestId('router-link')).toHaveAttribute(
                'aria-label',
                mockProps.item.fields.Link.value.href,
            );
        });
    });

    it('should render pill when PillText field enabled and showPillLabel enabled', () => {
        mockProps.showPillLabel = true;
        mockProps.item.fields.PillText = { value: 'text' };
        render(<PromoBlockItemBig {...mockProps} />);

        expect(screen.getByTestId('router-link')).toBeInTheDocument();
        expect(screen.getByTestId('pill-component')).toBeInTheDocument();
    });

    it('should NOT render link when it is not defined', () => {
        mockProps.item.fields.Link = mockSitecoreField(mockSitecoreLinkField());
        render(<PromoBlockItemBig {...mockProps} />);

        expect(screen.getByTestId('promo-block')).toBeInTheDocument();
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
    });

    it('should NOT render title when it is not defined', () => {
        mockProps.item.fields.Title = mockSitecoreField('');
        render(<PromoBlockItemBig {...mockProps} />);

        expect(screen.queryByTestId('promo-block-title')).not.toBeInTheDocument();
    });

    it('should render button wrapper when hasLink is false and call handleClick methods on click', async () => {
        mockProps.item.fields.Link = mockSitecoreField(mockSitecoreLinkField());

        const { container } = render(<PromoBlockItemBig {...mockProps} />);

        const buttonElement = screen.getByRole('button');

        expect(container.firstChild).toHaveClass('test-class');
        expect(buttonElement).toBeInTheDocument();
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();

        await userEvent.click(buttonElement);

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockTrackItemClick).toHaveBeenCalled();
    });

    it('should render RouterLink wrapper when hasLink is true and CTA is not shown and call handleClick methods on link click', async () => {
        render(<PromoBlockItemBig {...mockProps} />);

        expect(mockRouterLinkProps).toHaveBeenCalledTimes(1);

        await userEvent.click(screen.getByTestId('router-link'));

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockTrackItemClick).toHaveBeenCalled();
    });

    it('should render div wrapper when hasLink is true, CTA is shown and Description is empty', () => {
        mockProps.item.fields.CTAText = mockSitecoreField('CTAText');
        mockProps.item.fields.Description = mockSitecoreField('');

        const { container } = render(<PromoBlockItemBig {...mockProps} />);

        expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
        expect(container.firstChild).toHaveAttribute('data-tid', 'promo-block');
    });

    it('should render button with CTAText when hasLink is true, CTA is shown and Description is empty', () => {
        mockProps.item.fields.CTAText = mockSitecoreField('CTAText');
        mockProps.item.fields.Description = mockSitecoreField('');

        render(<PromoBlockItemBig {...mockProps} />);

        expect(within(screen.getByTestId('promo-block-description')).getByTestId('router-link')).toHaveTextContent(
            mockProps.item.fields.CTAText.value,
        );
        expect(mockRouterLinkProps).toHaveBeenCalledTimes(1);
        expect(mockRouterLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataId: 'promo-block-cta',
            }),
        );
    });
});

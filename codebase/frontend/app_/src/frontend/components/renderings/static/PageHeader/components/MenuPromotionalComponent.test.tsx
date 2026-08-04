import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ILivePrice } from 'models/data/ILivePrice';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import MenuPromotionalComponent from './MenuPromotionalComponent';

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return (
            <div data-tid='router-link' onClick={props.onClick}>
                {props.children}
            </div>
        );
    },
}));

const mockRichTextWithLinkProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinkProps(props);

        return <div data-tid='rich-text-with-link' />;
    },
}));

describe('<MenuPromotionalComponent/>', () => {
    const resetMocks = () =>
        ({
            promotionalComponent: {
                fields: {
                    Title: { value: 'Title' },
                    Description: { value: 'Description' },
                    Image: {
                        value: {
                            src: 'img',
                        },
                    },
                    Link: {
                        value: {
                            href: 'test',
                            text: 'test',
                            linktype: SitecoreLinkType.Internal,
                        },
                    },
                },
                id: '',
                livePrice: { price: 200, pricePP: 100 } as Nullable<ILivePrice>,
            },
            onClick: jest.fn(a => a),
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<MenuPromotionalComponent {...mocks} />);

        expect(screen.getByTestId('router-link')).toBeInTheDocument();
        expect(mockRouterLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'destination-menu__list-promotion-cta',
                link: mocks.promotionalComponent.fields.Link,
                onClick: expect.any(Function),
            }),
        );

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mocks.promotionalComponent.fields.Image,
                fill: true,
                mediaSize: { desktop: MediaSize.Medium },
            }),
        );

        expect(screen.getByTestId('rich-text-with-link')).toBeInTheDocument();
        expect(mockRichTextWithLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mocks.promotionalComponent.fields.Description,
                className: 'destination-menu__list-promotional-description',
            }),
        );
    });

    it('should NOT render when promotionalComponent fields not defined', () => {
        mocks.promotionalComponent.fields = undefined;
        const { container } = render(<MenuPromotionalComponent {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('onClick', () => {
        it("should pass the name parameter to onClick with 'Image: ' prefix when target classList contains necessary className", async () => {
            render(<MenuPromotionalComponent {...mocks} />);

            const routerLink = screen.getByTestId('router-link');

            await userEvent.click(routerLink);

            expect(mocks.onClick).toHaveBeenCalledWith(
                expect.any(Object),
                mocks.promotionalComponent.fields.Title.value,
            );
        });

        it('should pass the name parameter to onClick with Title value when target classList not contains necessary className', async () => {
            render(<MenuPromotionalComponent {...mocks} />);

            const routerLink = screen.getByTestId('router-link');

            await userEvent.click(routerLink);

            expect(mocks.onClick).toHaveBeenCalledWith(
                expect.any(Object),
                mocks.promotionalComponent.fields.Title.value,
            );
        });
    });
});

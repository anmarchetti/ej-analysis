import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import TradePortalMenuPromotionalComponent, {
    IMenuPromotionalComponentProps,
} from 'frontend/components/renderings/TradePortalPageHeader/components/TradePortalMenuPromotionalComponent';

jest.mock('models/data/MediaSizeParams', () => ({
    getMediaSizeParams: () => ({ mw: 123, mh: 456 }),
    MediaSize: { Medium: 'medium' },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, className, onClick }) => (
        <div data-tid='list-promotion-cta' className={className} onClick={onClick}>
            {children}
        </div>
    ),
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: () => <div data-tid='richtext-with-links' />,
}));

const resetMocks = () =>
    ({
        promotionalComponent: {
            fields: {
                Title: mockSitecoreField('Title'),
                Description: mockSitecoreField('Description'),
                Image: mockSitecoreField({
                    src: 'img',
                }),
                Link: mockSitecoreField({
                    href: 'test',
                    text: 'test',
                    linktype: SitecoreLinkType.Internal,
                }),
                ModalContent: {
                    fields: {
                        ModalButtonText: mockSitecoreField('ModalButtonText'),
                        ModalDescription: mockSitecoreField('ModalDescription'),
                        ModalTitle: mockSitecoreField('ModalTitle'),
                    },
                },
            },
            id: '',
            livePrice: { price: 200, pricePP: 100 } as Nullable<ILivePrice>,
        },
        onClick: jest.fn(a => a),
    } as IMenuPromotionalComponentProps);

let mocks;

describe('<TradePortalMenuPromotionalComponent/>', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        const { container } = render(<TradePortalMenuPromotionalComponent {...mocks} />);

        expect(screen.getByTestId('list-promotion-cta')).toHaveClass(
            'header_trade__destination-menu__list-promotion-cta',
        );
        expect(container.querySelector('.header_trade__destination-menu__list-promotional-image')).toHaveStyle({
            backgroundImage: 'url("img?mw=123&mh=456")',
        });
        expect(container.querySelector('.header_trade__destination-menu__list-promotional-link')).toBeInTheDocument();
        expect(screen.getByTestId('richtext-with-links')).toBeInTheDocument();
    });

    it('should NOT render when promotionalComponent fields not defined', () => {
        mocks.promotionalComponent.fields = undefined;
        const { container } = render(<TradePortalMenuPromotionalComponent {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when promotionalComponent images not defined', () => {
        mocks.promotionalComponent.fields.Image.value.src = undefined;
        const { container } = render(<TradePortalMenuPromotionalComponent {...mocks} />);

        expect(container.querySelector('.header_trade__destination-menu__list-promotional-image')).toHaveStyle({
            backgroundImage: '',
        });
    });

    describe('onClick', () => {
        it("should pass the name parameter to onClick with 'Image: ' prefix when target classList contains necessary className", () => {
            const { container } = render(<TradePortalMenuPromotionalComponent {...mocks} />);

            fireEvent.click(container.querySelector('.header_trade__destination-menu__list-promotional-image')!);

            expect(mocks.onClick).toHaveBeenCalled();
            expect(mocks.onClick).toHaveBeenCalledWith(
                expect.any(Object),
                `Image: ${mocks.promotionalComponent.fields.Title.value}`,
            );
        });

        it('should pass the name parameter to onClick with Title value when target classList not contains necessary className', () => {
            const { container } = render(<TradePortalMenuPromotionalComponent {...mocks} />);

            fireEvent.click(container.querySelector('.header_trade__destination-menu__list-promotional-link')!);

            expect(mocks.onClick).toHaveBeenCalled();
            expect(mocks.onClick).toHaveBeenCalledWith(
                expect.any(Object),
                mocks.promotionalComponent.fields.Title.value,
            );
        });
    });
});

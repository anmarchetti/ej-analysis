import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';

import PromoMerchBanner from './PromoMerchBanner';

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('title'),
        Description: mockSitecoreField('description'),
        Link: mockSitecoreField(mockSitecoreLinkField('testlink', 'link')),
        Icon: mockSitecoreField(mockSitecoreImageField('image')),
        TermsAndConditions: mockSitecoreField('terms'),
        PromoCode: mockSitecoreField('promo'),
        TextBeforePromoCode: mockSitecoreField('before'),
        CopiedConfirmation: mockSitecoreField('confirm'),
        CopiedMessageShowingTime: mockSitecoreField(0),
    },
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    appStore: { isScreenMedium: true },
    queryParamStore: {},
    userStore: {},
    routerStore: {},
    trackingStore: { trackEventWithParams: jest.fn() },
    engageStore: { sendCustomEvent: jest.fn() },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return (
            <button data-tid='router-link' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

describe('<PromoMerchBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when no fields', () => {
        mockProps.fields = null;

        const { container } = render(<PromoMerchBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no title', () => {
        mockProps.fields.Title.value = '';

        const { container } = render(<PromoMerchBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render: image, title, description, button, promocode section', () => {
        render(<PromoMerchBanner {...mockProps} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'promo-merch-banner__icon',
                field: mockProps.fields.Icon,
                mediaSize: MediaSize.Small,
                dynamicSize: {
                    desktop: {
                        width: 45,
                        height: 26,
                    },
                    mobile: {
                        width: 55,
                        height: 33,
                    },
                },
            }),
        );
        expect(screen.getByRole('heading')).toHaveTextContent('title');
        expect(screen.getByText('description')).toBeInTheDocument();
        expect(screen.getByText('before')).toBeInTheDocument();
        expect(screen.getByText('promo')).toBeInTheDocument();
        expect(screen.getByTestId('router-link')).toBeInTheDocument();
        expect(screen.getByText('link')).toBeInTheDocument();
        expect(screen.getByText('terms')).toBeInTheDocument();
    });

    it('should NOT render: image, title, description, button, promocode section', () => {
        mockProps.fields.Title = null;
        mockProps.fields.Icon = null;
        mockProps.fields.Description = null;
        mockProps.fields.TextBeforePromoCode = null;
        mockProps.fields.PromoCode = null;
        mockProps.fields.Link = null;
        mockProps.fields.TermsAndConditions = null;

        render(<PromoMerchBanner {...mockProps} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        expect(screen.queryByText('description')).not.toBeInTheDocument();
        expect(screen.queryByText('before')).not.toBeInTheDocument();
        expect(screen.queryByText('promo')).not.toBeInTheDocument();
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        expect(screen.queryByText('link')).not.toBeInTheDocument();
        expect(screen.queryByText('terms')).not.toBeInTheDocument();
    });

    it('should NOT render promocode section', () => {
        mockProps.fields.PromoCode = null;

        render(<PromoMerchBanner {...mockProps} />);

        expect(screen.queryByText('before')).not.toBeInTheDocument();
        expect(screen.queryByText('promo')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
    });

    it('should call tracking functions when RouterLink is clicked', async () => {
        render(<PromoMerchBanner {...mockProps} />);

        const routerLink = screen.getByTestId('router-link');

        await userEvent.click(routerLink);

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalled();
        expect(mockStores.engageStore.sendCustomEvent).toHaveBeenCalledWith('PROMO_BANNER_INTERACTION', {
            buttonLabel: 'link',
            buttonLocation: 'testlink',
        });
    });
});

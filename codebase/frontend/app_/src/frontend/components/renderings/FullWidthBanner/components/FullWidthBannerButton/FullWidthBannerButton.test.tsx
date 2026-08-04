import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { CTAThemeType } from 'models/data/IFullWithBanner';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { mockFullWidthBannerMockFields } from 'frontend/components/renderings/FullWidthBanner/mocks';

import FullWidthBannerButton, { IFullWidthBannerButtonProps } from './FullWidthBannerButton';

const createProps = (): IFullWidthBannerButtonProps => ({
    fields: mockFullWidthBannerMockFields(),
    CTATheme: CTAThemeType.Filled,
});

let mockProps: IFullWidthBannerButtonProps;

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockRouterLinkProps(props);

        return (
            <div data-tid='router-link' onClick={onClick}>
                {children}
            </div>
        );
    },
}));

let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FullWidthBannerButton />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render router link with btn class when CTAThemeType is Filled', () => {
        render(<FullWidthBannerButton {...mockProps} />);

        expect(screen.getByTestId('router-link')).toHaveTextContent('CTA');
        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            dataId: 'full-width-banner-cta',
            link: mockProps.fields.CTA,
            className: 'btn',
        });
    });

    it('should render router link with link class when CTAThemeType is Url', () => {
        mockProps.CTATheme = CTAThemeType.Url;

        render(<FullWidthBannerButton {...mockProps} />);

        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            dataId: 'full-width-banner-cta',
            link: mockProps.fields.CTA,
            className: 'link',
        });
    });

    it('should render router link with btn and btn--outlined classes when CTAThemeType is Outlined', () => {
        mockProps.CTATheme = CTAThemeType.Outlined;

        render(<FullWidthBannerButton {...mockProps} />);

        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            dataId: 'full-width-banner-cta',
            link: mockProps.fields.CTA,
            className: 'btn btn--outlined',
        });
    });

    it('should call trackEventWithParams on click', () => {
        const mockTrackingParams = {
            eventType: EventTypes.GenericEvent,
            eventParams: {
                eventAction: EventActions.ImpressionClicked,
                eventCategory: EventCategories.FullWidthBanner,
                eventLabel: mockProps.fields.TrackingTitle.value,
                eventType: EventTypes.Interaction,
            },
            customParams: {
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
                genericValue4: null,
                destinationUrl: null,
            },
        };

        render(<FullWidthBannerButton {...mockProps} />);

        screen.getByTestId('router-link').click();

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledTimes(1);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            mockTrackingParams.eventType,
            mockTrackingParams.eventParams,
            mockTrackingParams.customParams,
        );
    });

    it('should NOT render router link when CTA href is NOT provided', () => {
        mockProps.fields.CTA!.value.href = '';

        const { container } = render(<FullWidthBannerButton {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render router link when CTA text is NOT provided', () => {
        mockProps.fields.CTA!.value.text = '';

        const { container } = render(<FullWidthBannerButton {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { baseExperimentsMock, beachExperimentMock } from 'frontend/__mocks__/experiments';
import { ctaMock, getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import GenericHeroBannerVariant from 'models/enum/GenericHeroBannerVariant';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventLocations } from 'models/enum/tracking/GenericEventParams';

import { HeroBanner, IHeroBannerProps } from './GenericHeroBanner';
import * as utils from './heroBanner.utils';

const createStores = () =>
    createMockStores({
        layoutStore: { sitePath: 'sitePath' },
        trackingStore: { trackHomepageAction: jest.fn(), trackPersonalizedClick: jest.fn() },
        engageStore: {
            experimentsByUniqueId: baseExperimentsMock,
            saveHeroBannerClickEvent: jest.fn(),
        },
    });

const createProps = (): IHeroBannerProps => ({
    fields: getMockedBannerFields(),
    rendering: { uid: 'b6e7639f-c2ca-4821-b271-dbc5cca84932' },
    params: { ClassName: 'propsClassName' },
    isLower: false,
    singleSlide: true,
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockStopPropagation = jest.fn();
const mockHeroBannerContent = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/HeroBannerContent/HeroBannerContent', () => ({
    __esModule: true,
    default: ({ handleClickButton, ...props }) => {
        mockHeroBannerContent(props);

        return (
            <button
                data-tid='hero-banner-content'
                onClick={() =>
                    handleClickButton(
                        { stopPropagation: mockStopPropagation },
                        mockSitecoreField({
                            href: 'https://web.holidays.easyjet.com/en/holidays/test/path-to-item?org=LTN',
                            text: 'text from link mock',
                        }),
                    )
                }
            />
        );
    },
}));

const mockHeroBannerImages = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/HeroBannerImages/HeroBannerImages', () => ({
    __esModule: true,
    default: props => {
        mockHeroBannerImages(props);

        return <div data-tid='hero-banner-images' />;
    },
}));

const mockHeroBannerPromo = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/components/HeroBannerPromo/HeroBannerPromo', () => ({
    __esModule: true,
    default: ({ onClickLink, ...props }) => {
        mockHeroBannerPromo(props);

        return <button data-tid='hero-banner-promo' onClick={onClickLink} />;
    },
}));

const mockCreditAnchor = jest.fn();
jest.mock('frontend/components/common/CreditAnchor/CreditAnchor', () => ({
    __esModule: true,
    default: props => {
        mockCreditAnchor(props);

        return <div data-tid='credit-anchor' />;
    },
}));

const spyGetHeroBannerClassNames = jest.spyOn(utils, 'getHeroBannerClassNames');
const spyGetHeroBannerControls = jest.spyOn(utils, 'getHeroBannerControls');

describe('<HeroBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<HeroBanner {...mockProps} />);

        expect(spyGetHeroBannerClassNames).toHaveBeenCalledWith(
            '',
            mockProps.fields?.Brightness.value,
            mockProps.fields?.TextColor,
            mockProps.isLower,
            mockProps.singleSlide,
            mockProps.params.ClassName,
        );
        expect(spyGetHeroBannerControls).toHaveBeenCalledWith([ctaMock], beachExperimentMock);
        expect(mockHeroBannerImages).toHaveBeenCalledWith({
            mobileImage: mockProps.fields!.MobileOnlyImage,
            image: mockProps.fields!.Image,
        });
        expect(mockHeroBannerContent).toHaveBeenCalledWith({
            fields: mockProps.fields,
            experiment: beachExperimentMock,
        });
        expect(mockCreditAnchor).toHaveBeenCalledWith({
            fields: mockProps.fields,
            className: 'content',
        });
        expect(mockHeroBannerPromo).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    it('should skip render when fields undefined', () => {
        delete mockProps.fields;

        const { container } = render(<HeroBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should handle component click', async () => {
        render(<HeroBanner {...mockProps} />);

        const component = screen.getByTestId('hero-banner-click-catcher');
        expect(component).toHaveClass('clickHandler');
        expect(component).toHaveAttribute('tabIndex', '-1');

        await userEvent.click(component);

        expect(mockStores.engageStore.saveHeroBannerClickEvent).toHaveBeenCalledWith(
            mockProps.rendering.uid,
            EventTypes.HeroBannerClick,
        );
        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.HeroBannerClick, {
            location: EventLocations.HeroBannerImage,
            name: mockProps.fields!.Title!.value,
            section: mockProps.fields!.Subtitle!.value,
        });
    });

    it('should handle component click with empty name and section', async () => {
        mockProps.fields!.Title = undefined;
        mockProps.fields!.Subtitle = undefined;

        render(<HeroBanner {...mockProps} />);

        const component = screen.getByTestId('hero-banner-click-catcher');

        await userEvent.click(component);

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.HeroBannerClick, {
            location: EventLocations.HeroBannerImage,
            name: '',
            section: '',
        });
    });

    it('should render OpaqueWhiteStripe Variant', () => {
        mockProps.fields!.Variant.value = GenericHeroBannerVariant.OpaqueWhiteStripe;

        render(<HeroBanner {...mockProps} />);

        expect(spyGetHeroBannerClassNames).toHaveBeenCalledWith(
            GenericHeroBannerVariant.OpaqueWhiteStripe,
            mockProps.fields?.Brightness.value,
            mockProps.fields?.TextColor,
            mockProps.isLower,
            mockProps.singleSlide,
            mockProps.params.ClassName,
        );
        expect(screen.queryByTestId('hero-banner-promo')).not.toBeInTheDocument();
        expect(screen.queryByTestId('credit-anchor')).not.toBeInTheDocument();
    });

    it('should track personalized click on hero banner promo', async () => {
        render(<HeroBanner {...mockProps} />);

        const link = screen.getByTestId('hero-banner-promo');

        await userEvent.click(link);

        expect(mockStores.engageStore.saveHeroBannerClickEvent).toHaveBeenCalledWith(
            mockProps.rendering.uid,
            EventTypes.HeroBannerButtonClick,
        );
        expect(mockStores.trackingStore.trackPersonalizedClick).toHaveBeenCalledWith(
            EventTypes.HeroBannerButtonClick,
            mockProps.rendering.uid,
            EventLocations.HeroBannerButton,
            ctaMock.value.text,
            'sitePathhttps://web.holidays.easyjet.com/en/holidays/test/path-to-item?org=LTN',
            { position: undefined, section: mockProps.fields!.Title?.value },
        );
    });

    it('should track personalized click with empty section when Title is undefined', async () => {
        mockProps.fields!.Variant.value = GenericHeroBannerVariant.TwoBoxes;
        mockProps.fields!.Title = undefined;

        render(<HeroBanner {...mockProps} />);

        const link = screen.getByTestId('hero-banner-content');

        await userEvent.click(link);

        expect(mockStores.engageStore.saveHeroBannerClickEvent).toHaveBeenCalledWith(
            mockProps.rendering.uid,
            EventTypes.HeroBannerButtonClick,
        );
        expect(mockStores.trackingStore.trackPersonalizedClick).toHaveBeenCalledWith(
            EventTypes.HeroBannerButtonClick,
            mockProps.rendering.uid,
            EventLocations.HeroBannerButton,
            'text from link mock',
            'sitePathhttps://web.holidays.easyjet.com/en/holidays/test/path-to-item?org=LTN',
            { position: undefined, section: '' },
        );
        expect(mockStopPropagation).toHaveBeenCalled();
    });

    it('should apply lightboxWithRoundel style when variant is LightboxWithRoundel', () => {
        mockProps.fields!.Variant.value = GenericHeroBannerVariant.LightboxWithRoundel;

        render(<HeroBanner {...mockProps} />);

        expect(screen.getByTestId('generic-hero-banner')).toHaveClass('lightboxWithRoundel');
    });
});

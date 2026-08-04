import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import * as dateUtils from 'frontend/utils/date.utils';
import * as imageUtils from 'frontend/utils/getImage';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerCTAType from 'models/enum/banners/CTAType';
import BannerTextColor from 'models/enum/banners/TextColor';
import CountdownBannerVariant from 'models/enum/CountdownBannerVariant';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { CountdownBanner, ICountdownBannerProps } from './CountdownBanner';

jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: jest.fn(() => false),
}));

const mockColoredStripeCountdownBanner = jest.fn();
jest.mock('./components/ColoredStripeCountdownBanner', () => ({
    __esModule: true,
    default: ({ onClickButton, onClickComponent, ...restProps }) => {
        mockColoredStripeCountdownBanner(restProps);

        return (
            <div data-tid='colored-stripe-countdown-banner'>
                <button
                    data-tid='banner-button'
                    onClick={() =>
                        onClickButton(
                            { stopPropagation: jest.fn() },
                            mockSitecoreField(mockSitecoreLinkField('CTA', 'textCTA')),
                        )
                    }
                />
                <button data-tid='banner-component' onClick={onClickComponent} />
            </div>
        );
    },
}));

const mockCountdownWithinLightboxBanner = jest.fn();
jest.mock('./components/CountdownWithinLightboxBanner', () => ({
    __esModule: true,
    default: ({ onClickButton, onClickComponent, ...restProps }) => {
        mockCountdownWithinLightboxBanner(restProps);

        return (
            <div data-tid='countdown-within-lightbox-banner'>
                <button
                    data-tid='banner-button'
                    onClick={() =>
                        onClickButton(
                            { stopPropagation: jest.fn() },
                            mockSitecoreField(mockSitecoreLinkField('CTA', 'textCTA')),
                        )
                    }
                />
                <button data-tid='banner-component' onClick={onClickComponent} />
            </div>
        );
    },
}));

const mockFullImageCountdownBanner = jest.fn();
jest.mock('./components/FullImageCountdownBanner', () => ({
    __esModule: true,
    default: ({ onClickButton, onClickComponent, ...restProps }) => {
        mockFullImageCountdownBanner(restProps);

        return (
            <div data-tid='full-image-countdown-banner'>
                <button
                    data-tid='banner-button'
                    onClick={() =>
                        onClickButton(
                            { stopPropagation: jest.fn() },
                            mockSitecoreField(mockSitecoreLinkField('CTA', 'textCTA')),
                        )
                    }
                />
                <button data-tid='banner-component' onClick={onClickComponent} />
            </div>
        );
    },
}));

const mockSearchpodCountdownBanner = jest.fn();
jest.mock('./components/SearchpodCountdownBanner', () => ({
    __esModule: true,
    default: ({ onClickButton, onClickComponent, ...restProps }) => {
        mockSearchpodCountdownBanner(restProps);

        return (
            <div data-tid='search-pod-countdown-banner'>
                <button
                    data-tid='banner-button'
                    onClick={() =>
                        onClickButton(
                            { stopPropagation: jest.fn() },
                            mockSitecoreField(mockSitecoreLinkField('CTA', 'textCTA')),
                        )
                    }
                />
                <button data-tid='banner-component' onClick={onClickComponent} />
            </div>
        );
    },
}));

const createProps = (): ICountdownBannerProps => ({
    params: {},
    rendering: { uid: '109a532f-3629-42d2-abc2-9a450478cec0' } as any,
    fields: {
        AdditionalInfo: mockSitecoreField('AdditionalInfo'),
        CountdownLabel: mockSitecoreField('Subtitle'),
        CountdownVariant: mockSitecoreField(CountdownBannerVariant.Orange),
        DateTime: mockSitecoreField('DateTime'),
        HideAfterTimeElapsed: mockSitecoreField('1'),
        IntroTitle: mockSitecoreField('IntroTitle'),
        UseCode: mockSitecoreField('UseCode'),
        UseCodeLabel: mockSitecoreField('UseCodeLabel'),
        Brightness: mockSitecoreField(BannerBrightnessType.Dark),
        CTA: mockSitecoreField(mockSitecoreLinkField('CTA', 'textCTA')),
        CTAType: mockSitecoreField(BannerCTAType.Orange),
        Image: mockSitecoreField(mockSitecoreImageField('Image')),
        MobileOnlyImage: mockSitecoreField(mockSitecoreImageField('MobileOnlyImage')),
        TextColor: mockSitecoreField(BannerTextColor.Black),
        Subtitle: mockSitecoreField('Subtitle'),
        Title: mockSitecoreField('Title'),
        CreditIcon: mockSitecoreField(mockSitecoreImageField('CreditIcon')),
        CreditLink: mockSitecoreField(mockSitecoreLinkField('CreditLink')),
        CreditText: mockSitecoreField('CreditText'),
    },
    toggleShowCountdownBanner: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            sitePath: 'sitePath',
            getTimeUnitLabel: jest.fn(),
        },
        trackingStore: {
            trackPersonalizedClick: jest.fn(),
            trackHomepageAction: jest.fn(),
        },
        engageStore: {
            saveHeroBannerClickEvent: jest.fn(),
        },
    });

const mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('CountdownBanner', () => {
    beforeEach(() => {
        mockProps = createProps();
        jest.mocked(useMobileViewport).mockReturnValue(false);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should call trackPersonalizedClick on button click', async () => {
        render(<CountdownBanner {...mockProps} />);

        await userEvent.click(screen.getByTestId('banner-button'));

        expect(mockStores.engageStore.saveHeroBannerClickEvent).toHaveBeenCalledWith(
            mockProps.rendering.uid,
            EventTypes.HeroBannerClick,
        );
        expect(mockStores.trackingStore.trackPersonalizedClick).toHaveBeenCalledWith(
            'hero_banner_button_click',
            mockProps.rendering.uid,
            'Hero Banner Button',
            'textCTA',
            'sitePathcta',
            { section: 'Title' },
        );
    });

    it('should skip render when fields are undefined', () => {
        render(<CountdownBanner {...mockProps} fields={undefined} />);

        expect(screen.queryByTestId('banner-component')).not.toBeInTheDocument();
    });

    it('should call trackHomepageAction on image click', async () => {
        render(<CountdownBanner {...mockProps} />);

        await userEvent.click(screen.getByTestId('banner-component'));

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith('hero_banner_click', {
            location: 'Hero Banner Image',
            name: 'Title',
            section: 'Subtitle',
        });
    });

    it('should call toggleShowCountdownBanner(false) when time elapsed and HideAfterTimeElapsed is enabled', () => {
        const toggleShowCountdownBanner = jest.fn();
        const now = new Date('2026-04-28T10:00:00.000Z');
        const oneMinuteAgo = new Date('2026-04-28T09:59:00.000Z');

        jest.useFakeTimers().setSystemTime(now);

        render(
            <CountdownBanner
                {...mockProps}
                toggleShowCountdownBanner={toggleShowCountdownBanner}
                fields={{
                    ...mockProps.fields!,
                    HideAfterTimeElapsed: mockSitecoreField('1'),
                    DateTime: mockSitecoreField(oneMinuteAgo.toISOString()),
                }}
            />,
        );

        jest.advanceTimersByTime(1100);

        expect(toggleShowCountdownBanner).toHaveBeenCalledWith(false);
    });

    it('should NOT throw when time elapsed and HideAfterTimeElapsed is enabled but toggleShowCountdownBanner is undefined', () => {
        const now = new Date('2026-04-28T10:00:00.000Z');
        const oneMinuteAgo = new Date('2026-04-28T09:59:00.000Z');

        jest.useFakeTimers().setSystemTime(now);

        expect(() => {
            render(
                <CountdownBanner
                    {...mockProps}
                    toggleShowCountdownBanner={undefined}
                    fields={{
                        ...mockProps.fields!,
                        HideAfterTimeElapsed: mockSitecoreField('1'),
                        DateTime: mockSitecoreField(oneMinuteAgo.toISOString()),
                    }}
                />,
            );

            jest.advanceTimersByTime(1100);
        }).not.toThrow();
    });

    it('should return countdown data from getCountdownTime in timeBeforeStart', () => {
        const fields = mockProps.fields!;
        const now = new Date('2026-04-28T10:00:00.000Z');
        const futureDate = new Date('2026-04-28T12:30:40.000Z');
        const countdown = [
            { value: 0, label: 'days-0' },
            { value: 2, label: 'hours-2' },
            { value: 30, label: 'minutes-30' },
            { value: 40, label: 'seconds-40' },
        ];
        jest.useFakeTimers().setSystemTime(now);
        const getCountdownTimeSpy = jest.spyOn(dateUtils, 'getCountdownTime').mockReturnValue(countdown);

        render(
            <CountdownBanner
                {...mockProps}
                fields={{
                    ...fields,
                    DateTime: mockSitecoreField(futureDate.toISOString()),
                }}
            />,
        );

        expect(mockColoredStripeCountdownBanner).toHaveBeenCalledWith(expect.objectContaining({ time: countdown }));
        expect(getCountdownTimeSpy).toHaveBeenCalledWith(futureDate, now, mockStores.layoutStore.getTimeUnitLabel);
    });

    it('should use desktop image for backgroundStyles when screen is NOT medium', () => {
        const fields = mockProps.fields!;
        const styles = { backgroundImage: 'url(test-desktop.jpg)' };
        const getBackgroundStylesSpy = jest
            .spyOn(imageUtils, 'getSitecoreImageBackgroundStyles')
            .mockReturnValue(styles);

        render(<CountdownBanner {...mockProps} />);

        expect(mockColoredStripeCountdownBanner).toHaveBeenCalledWith(
            expect.objectContaining({ backgroundStyles: styles }),
        );
        expect(getBackgroundStylesSpy).toHaveBeenCalledWith(fields.Image, MediaSize.Large, false);
    });

    it('should use mobile image for backgroundStyles when screen is medium and mobile image exists', () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        const fields = mockProps.fields!;

        const styles = { backgroundImage: 'url(test-mobile.jpg)' };
        const getBackgroundStylesSpy = jest
            .spyOn(imageUtils, 'getSitecoreImageBackgroundStyles')
            .mockReturnValue(styles);

        render(<CountdownBanner {...mockProps} />);

        expect(mockColoredStripeCountdownBanner).toHaveBeenCalledWith(
            expect.objectContaining({ backgroundStyles: styles }),
        );
        expect(getBackgroundStylesSpy).toHaveBeenCalledWith(fields.MobileOnlyImage, MediaSize.Large, true);
    });

    it('should fallback to desktop image for backgroundStyles when mobile image src is missing', () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        const fields = mockProps.fields!;
        const propsWithEmptyMobileImage: ICountdownBannerProps = {
            ...mockProps,
            fields: {
                ...fields,
                MobileOnlyImage: mockSitecoreField({ src: '' }),
            },
        };
        const updatedFields = propsWithEmptyMobileImage.fields!;

        const styles = { backgroundImage: 'url(test-fallback.jpg)' };
        const getBackgroundStylesSpy = jest
            .spyOn(imageUtils, 'getSitecoreImageBackgroundStyles')
            .mockReturnValue(styles);

        render(<CountdownBanner {...propsWithEmptyMobileImage} />);

        expect(mockColoredStripeCountdownBanner).toHaveBeenCalledWith(
            expect.objectContaining({ backgroundStyles: styles }),
        );
        expect(getBackgroundStylesSpy).toHaveBeenCalledWith(updatedFields.Image, MediaSize.Large, true);
    });
});

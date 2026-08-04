import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { ComponentVersion, TextAlignmentVariant, TFullWidthBannerProps } from 'models/data/IFullWithBanner';
import { MediaSize } from 'models/data/MediaSizeParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import { FullWidthBanner } from './FullWidthBanner';
import { getMockFullWidthBannerProps } from './mocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseInView = { inView: true };
jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    useInView: jest.fn(() => mockUseInView),
}));

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

jest.mock('./components/FullWidthBannerInfo/FullWidthBannerInfo', () => ({
    __esModule: true,
    FullWidthBannerInfo: () => <div data-tid='full-width-banner-info' />,
}));

jest.mock(
    'frontend/components/renderings/FullWidthBanner/BannerWithKeySellingPoints/BannerWithKeySellingPoints',
    () => ({
        __esModule: true,
        default: () => <div data-tid='banner-with-key-selling-points' />,
    }),
);

const createStores = () =>
    createMockStores({
        layoutStore: { isEditMode: false },
    });

const mockStores = createStores();

const resetMocks = (): TFullWidthBannerProps => getMockFullWidthBannerProps();

let mocks = resetMocks();

describe('<FullWidthBanner />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockUseInView = { inView: true };
    });

    it('Should NOT render component when NO fields', () => {
        delete mocks.fields;
        const { container } = render(<FullWidthBanner {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should standard render', () => {
        render(<FullWidthBanner {...mocks} />);

        expect(screen.getByTestId('full-width-banner')).toBeInTheDocument();
        expect(screen.queryByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'image',
                field: mocks.fields?.Image,
                fill: true,
                mediaSize: { desktop: MediaSize.Big, mobile: MediaSize.Medium },
            }),
        );
        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
        expect(screen.getByTestId('full-width-banner-info')).toBeInTheDocument();
    });

    it('Should render slim version of banner when ComponentVersion is SlimWithoutShard', () => {
        mocks.params.Version = ComponentVersion.SlimWithoutShard;
        const { container } = render(<FullWidthBanner {...mocks} />);

        expect(container.firstChild).toHaveClass('bannerSlim');
    });

    it('Should render slim version of banner when ComponentVersion is SlimWithShardMirrored', () => {
        mocks.params.Version = ComponentVersion.SlimWithShardMirrored;
        const { container } = render(<FullWidthBanner {...mocks} />);

        expect(container.firstChild).toHaveClass('shardMirrored');
    });

    it('Should render slim version of banner when ComponentVersion is SlimWithShard', () => {
        mocks.params.Version = ComponentVersion.SlimWithShard;
        const { container } = render(<FullWidthBanner {...mocks} />);

        expect(container.firstChild).toHaveClass('bannerSlim');
    });

    it('should render BannerWithKeySellingPoints when Version is WithKeySellingPoints', () => {
        mocks.params.Version = ComponentVersion.WithKeySellingPoints;

        render(<FullWidthBanner {...mocks} />);

        expect(screen.getByTestId('banner-with-key-selling-points')).toBeInTheDocument();
    });

    it('Should render additional classes based on themes params', () => {
        mocks.params = {
            ...mocks.params,
            TextAlignment: TextAlignmentVariant.Left,
            Version: ComponentVersion.GenericContent,
        };
        const { container } = render(<FullWidthBanner {...mocks} />);

        expect(container.firstChild).toHaveClass('leftText');
        expect(container.firstChild).toHaveClass('genericContentBanner');
    });

    it('Should render JSSImage instead of JSSImageNext in Edit mode', () => {
        mockStores.layoutStore.isEditMode = true;
        render(<FullWidthBanner {...mocks} />);

        expect(screen.queryByTestId('jss-image-next')).not.toBeInTheDocument();
        expect(screen.getByTestId('banner-media-edit')).toBeInTheDocument();
        expect(screen.queryByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImage).toHaveBeenCalledWith({
            field: mocks.fields?.Image,
        });
    });

    it('should call trackEventWithParams when component is visible', async () => {
        const mockTrackingParams = {
            eventType: EventTypes.GenericEvent,
            eventParams: {
                eventAction: EventActions.Impressions,
                eventCategory: EventCategories.FullWidthBanner,
                eventLabel: mocks.fields!.TrackingTitle.value,
                eventType: EventTypes.NonInteraction,
            },
            customParams: {
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
                genericValue4: null,
                destinationUrl: null,
            },
        };

        render(<FullWidthBanner {...mocks} />);

        await waitFor(() => {
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledTimes(1);
        });
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            mockTrackingParams.eventType,
            mockTrackingParams.eventParams,
            mockTrackingParams.customParams,
        );
    });

    it('should NOT call trackEventWithParams when component is not visible', async () => {
        mockUseInView.inView = false;

        render(<FullWidthBanner {...mocks} />);

        await waitFor(() => {
            expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });
    });
});

import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FastTrackAndSpeedyBoarding, { TFastTrackAndSpeedyBoardingProps } from './FastTrackAndSpeedyBoarding';

const createProps = (): TFastTrackAndSpeedyBoardingProps => ({
    fields: {
        BannerTitle: mockSitecoreField('Banner Title'),
        FastTrackDescription: mockSitecoreField('Fast Track Description'),
        FastTrackIcon: mockSitecoreField(mockSitecoreImageField('Fast Track Icon')),
        FastTrackTitle: mockSitecoreField('Fast Track Title'),
        SpeedyBoardingDescription: mockSitecoreField('Speedy Boarding Description'),
        SpeedyBoardingIcon: mockSitecoreField(mockSitecoreImageField('Speedy Boarding Icon')),
        SpeedyBoardingTitle: mockSitecoreField('Speedy Boarding Title'),
    },
    params: {},
    rendering: {},
});

let mockProps = createProps();
let mockStores;

const mockAncillariesHeader = jest.fn();
jest.mock('frontend/components/common/Ancillaries/components/AncillariesHeader/AncillariesHeader', () => ({
    __esModule: true,
    default: props => {
        mockAncillariesHeader(props);

        return <div data-tid='ancillaries-header' />;
    },
}));

const mockAncillariesMainContent = jest.fn();
jest.mock('frontend/components/common/Ancillaries/components/AncillariesMainContent/AncillariesMainContent', () => ({
    __esModule: true,
    default: props => {
        mockAncillariesMainContent(props);

        return <div data-tid='ancillaries-main-content' />;
    },
}));

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{children}</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FastTrackAndSpeedyBoarding />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({ bookingStore: { isLuxuryPackage: true } });
    });

    it('should render the component', () => {
        render(<FastTrackAndSpeedyBoarding {...mockProps} />);

        expect(screen.getByTestId('fast-track-speedy-boarding')).toBeInTheDocument();

        expect(screen.getByTestId('ancillaries-header')).toBeInTheDocument();
        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields?.BannerTitle,
            dataTid: 'fast-track-speedy-boarding-header',
        });

        expect(screen.getAllByTestId('ancillaries-main-content')).toHaveLength(2);
        expect(mockAncillariesMainContent).toHaveBeenNthCalledWith(1, {
            Subtitle: mockProps.fields?.FastTrackTitle,
            Description: mockProps.fields?.FastTrackDescription,
            Icon: mockProps.fields?.FastTrackIcon,
            dataTid: 'fast-track',
        });
        expect(mockAncillariesMainContent).toHaveBeenNthCalledWith(2, {
            Subtitle: mockProps.fields?.SpeedyBoardingTitle,
            Description: mockProps.fields?.SpeedyBoardingDescription,
            Icon: mockProps.fields?.SpeedyBoardingIcon,
            dataTid: 'speedy-boarding',
        });
    });

    it('should NOT render the component if fields are not provided', () => {
        mockProps.fields = undefined;

        const { container } = render(<FastTrackAndSpeedyBoarding {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render the component if isLuxuryPackage is false', () => {
        mockStores.bookingStore.isLuxuryPackage = false;

        const { container } = render(<FastTrackAndSpeedyBoarding {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render outline banner with correct props', () => {
        render(<FastTrackAndSpeedyBoarding {...mockProps} />);

        expect(mockLuxuryWrapper).toHaveBeenCalledWith({
            label: SitecoreDictionary.LuggageLabelsIncluded,
        });

        const banner = screen.getByTestId('luxury-wrapper');
        expect(banner).toBeInTheDocument();
        expect(within(banner).getByTestId('fast-track-speedy-boarding-content')).toBeInTheDocument();
        expect(within(banner).getAllByTestId('ancillaries-main-content')).toHaveLength(2);
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockTransfer } from 'frontend/__mocks__';
import { luggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { filterPackageIcons } from 'frontend/utils/offer.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import HolidayPackageIcons from './HolidayPackageIcons';

jest.mock('frontend/utils/offer.utils');
const mockFilterPackageIcons = filterPackageIcons as jest.MockedFn<typeof filterPackageIcons>;

const createStores = () =>
    createMockStores({
        layoutStore: {
            isHotelDetailsBrowsePage: false,
            isShortlistPage: false,
            isHotelDetailsBrowsePagePreview: false,
        },
    });

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('./JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

describe('<HolidayPackageIcons />', () => {
    const resetMocks = () =>
        ({
            transfer: mockTransfer,
            packageIcons: [],
            extraLuggage: luggageInfoMock,
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();

        mockFilterPackageIcons.mockImplementation(icons => icons);
    });

    it('should be empty render', () => {
        const { container } = render(<HolidayPackageIcons {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render icons with separator', () => {
        mocks.iconClassName = 'test-class';
        mocks.packageIcons = [
            { key: 'test1', name: 'test1', iconUrl: 'test1' },
            { key: 'test2', name: 'test2', iconUrl: 'test2' },
        ];
        const { container } = render(<HolidayPackageIcons {...mocks} />);

        const iconWrappers = screen.getAllByTestId('holiday-package-icon-wrapper');
        expect(container.querySelectorAll('.icons-summ__icon-item')).toHaveLength(2);
        expect(container.querySelectorAll('.icons-summ__plus-box')).toHaveLength(1);
        expect(container.querySelectorAll('.title.visually-hidden')).toHaveLength(0);
        expect(screen.getAllByTestId('jss-next-image').length).toBe(2);
        expect(iconWrappers.length).toBe(2);
        expect(iconWrappers[0]).toHaveClass('test-class');
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: { value: { src: mocks.packageIcons[0].iconUrl } },
                mediaSize: MediaSize.Small,
                width: 24,
                height: 24,
                'data-tid': 'test1_icon',
                className: 'icon--bg-image',
            }),
        );
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: { value: { src: mocks.packageIcons[1].iconUrl } },
                mediaSize: MediaSize.Small,
                width: 24,
                height: 24,
                'data-tid': 'test2_icon',
                className: 'icon--bg-image',
            }),
        );
    });

    it('should render icons with hidden title', () => {
        mocks.packageIcons = [{ key: 'test1', name: 'test1', iconUrl: 'test1' }];
        mocks.hideTitle = true;
        const { container } = render(<HolidayPackageIcons {...mocks} />);

        expect(container.querySelector('.title')).toHaveClass('visually-hidden');
    });

    it('should correctly call filterPackageIcons', () => {
        mocks.packageIcons = [{ key: PackageIconTypes.Bags, name: 'test1', iconUrl: 'test1', luggageCode: 'SCB1' }];
        render(<HolidayPackageIcons {...mocks} />);

        expect(mockFilterPackageIcons).toHaveBeenCalledWith(
            mocks.packageIcons,
            mockTransfer,
            luggageInfoMock,
            undefined,
        );
    });

    it('should NOT render component if no icons', () => {
        const { container } = render(<HolidayPackageIcons {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component if isHotelDetailsBrowsePagePreview', () => {
        mockStores.layoutStore.isHotelDetailsBrowsePagePreview = true;

        const { container } = render(<HolidayPackageIcons {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render with extra icon if extraIcon is included in props', () => {
        mocks.extraIcon = { key: 'extra', name: 'Extra Icon', iconUrl: 'extra-icon-url' };

        render(<HolidayPackageIcons {...mocks} />);

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
    });

    it('should change bag name to LuggageLabels26kgHoldBagPlural when isLuxuryPackage is true', () => {
        mocks.isLuxuryPackage = true;

        render(<HolidayPackageIcons {...mocks} />);

        expect(mockFilterPackageIcons).toHaveBeenCalledWith(
            mocks.packageIcons,
            mockTransfer,
            luggageInfoMock,
            SitecoreDictionary.LuggageLabels26kgHoldBagPlural,
        );
    });
});

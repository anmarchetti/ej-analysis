import * as React from 'react';
import { waitFor } from '@testing-library/dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { observable, runInAction } from 'mobx';

import * as utils from 'frontend/utils/getLocationHierarchy';
import { ILocationItem } from 'models/data/ILocationHierarchy';
import { IResortInfo } from 'models/data/IResortInfo';

import ResortInfoBlock from './ResortInfoBlock';

let mockStores;

const createDeferred = () => {
    let resolve: (value?: unknown) => void;
    const promise = new Promise(res => {
        resolve = res;
    });

    return { promise, resolve: resolve! };
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () => ({
    appStore: {},
    bookingStore: {
        accommodationId: 'hotel-id-1',
        selectedOffer: {
            price: 100,
            pricePP: 50,
        },
        loadResortInfo: jest.fn().mockResolvedValue('loaded'),
        resortInfo: {
            resortDescription: 'test description',
            resortImageUrl: 'test image',
        },
        isShownMapOnDesktop: false,
        isShownMapOnMobile: false,
        toggleMapVisibilityOnDesktop: jest.fn(),
        toggleMapVisibilityOnMobile: jest.fn(),
    },
    layoutStore: {
        getPhrase: jest.fn(e => e),
        layout: {} as any,
        isHotelDetailsBrowsePage: false,
        accommodationOrDestinationCode: 'destination-id-1',
    },
});

const mockGetLocationHierarchy = jest.spyOn(utils, 'getLocationHierarchy').mockReturnValue({
    resort: { name: 'test location hierarchy' } as ILocationItem,
    country: { name: 'test country' } as ILocationItem,
});

describe('<ResortInfoBlock />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should NOT render when selected offer is undefined', async () => {
        mockStores.bookingStore.selectedOffer = undefined;

        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(screen.queryByTestId('resort-info')).not.toBeInTheDocument();
        });
    });

    it('should render resort-info block when resortInfo is provided', async () => {
        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(screen.queryByTestId('resort-info')).toBeInTheDocument();
        });
    });

    it('should render resort-info-block-no-content when resortInfo is not provided', () => {
        mockStores.bookingStore.resortInfo = null as Nullable<IResortInfo>;
        render(<ResortInfoBlock />);
        expect(screen.queryByTestId('resort-info-block-no-content')).toBeInTheDocument();
        expect(screen.queryByTestId('resort-info-block-title')).toBeInTheDocument();
    });

    it('should call loadResortInfo when mounted', async () => {
        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(mockStores.bookingStore.loadResortInfo).toHaveBeenCalled();
        });
    });

    it('should call loadResortInfo on hotel browse page even without selected offer', async () => {
        mockStores.bookingStore.selectedOffer = undefined;
        mockStores.layoutStore.isHotelDetailsBrowsePage = true;

        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(mockStores.bookingStore.loadResortInfo).toHaveBeenCalled();
        });
    });

    it('should show no-content fallback while loading next resort info after navigation', async () => {
        mockStores = observable(createStores());

        const firstLoad = createDeferred();
        const secondLoad = createDeferred();

        const loadResortInfo = jest
            .fn()
            .mockImplementationOnce(() => firstLoad.promise)
            .mockImplementationOnce(() => secondLoad.promise);
        mockStores.bookingStore.loadResortInfo = loadResortInfo;

        render(<ResortInfoBlock />);

        await act(async () => {
            firstLoad.resolve('loaded');
        });

        await waitFor(() => {
            expect(screen.getByTestId('resort-info-block-description-text').innerHTML).toContain('test description');
        });

        runInAction(() => {
            mockStores.bookingStore.accommodationId = 'hotel-id-2';
        });

        await waitFor(() => {
            expect(loadResortInfo).toHaveBeenCalledTimes(2);
        });

        await waitFor(() => {
            expect(screen.queryByTestId('resort-info-block-description-text')).not.toBeInTheDocument();
            expect(screen.getByTestId('resort-info-block-no-content')).toBeInTheDocument();
        });

        runInAction(() => {
            mockStores.bookingStore.resortInfo = {
                resortDescription: 'new resort description',
                resortImageUrl: 'new image',
            };
        });

        await act(async () => {
            secondLoad.resolve('loaded');
        });

        await waitFor(() => {
            expect(screen.getByTestId('resort-info-block-description-text').innerHTML).toContain(
                'new resort description',
            );
            expect(screen.getByTestId('resort-info-block-description-text').innerHTML).not.toContain(
                'test description',
            );
        });
    });

    it('should set descriptionText on update', async () => {
        const testDescription = 'testDescription';
        mockStores.bookingStore.resortInfo = { resortDescription: testDescription } as IResortInfo;

        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(screen.getByTestId('resort-info-block-description-text').innerHTML).toContain(testDescription);
        });
    });

    it('should not set moreDescriptionText when there is no additional content', async () => {
        const testDescription = '<p>testDescription</p>';
        mockStores.bookingStore.resortInfo = { resortDescription: testDescription } as IResortInfo;

        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(screen.queryByTestId('resort-info-block-more-description-text')).toBeNull();
        });
    });

    it('should toggle isReadLess state on button click', async () => {
        const testDescription = '<p>testDescription</p>';
        const testMoreDescription = '<p>moreDescription</p>';
        mockStores.bookingStore.resortInfo = {
            resortDescription: testDescription + testMoreDescription,
        } as IResortInfo;

        await act(async () => {
            render(<ResortInfoBlock />);
        });

        const readMoreButton = screen.getByTestId('read-more-button');
        fireEvent.click(readMoreButton);

        await waitFor(() => {
            expect(screen.getByTestId('read-more-button')).toBeInTheDocument();
        });
    });

    it('should render explore label if no resortInfo received', async () => {
        mockStores.bookingStore.resortInfo = null;
        mockStores.bookingStore.selectedOffer.hotel = { resort: { name: 'testName' } };

        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(screen.queryByTestId('resort-info-block-no-content')).toBeInTheDocument();
            expect(screen.queryByTestId('resort-info-block-title')).toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith('HotelResortInfo.Labels.Explore');
        });
    });

    it('should call getLocationHierarchy when isHotelDetailsBrowsePage is true', async () => {
        mockStores.bookingStore.resortInfo = null;
        mockStores.layoutStore.isHotelDetailsBrowsePage = true;

        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(mockGetLocationHierarchy).toHaveBeenCalled();
        });
    });

    it('should call getLocationHierarchy when isHotelDetailsBrowsePage is true', async () => {
        mockStores.bookingStore.resortInfo = null;
        mockStores.layoutStore.isHotelDetailsBrowsePage = true;

        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(mockGetLocationHierarchy).toHaveBeenCalled();
        });
    });

    it('should render resort-info when valid resortInfo is provided', async () => {
        const testDescription = '<p>testDescription</p>';
        const testMoreDescription = '<p>moreDescription</p>';
        mockStores.bookingStore.resortInfo = {
            resortDescription: testDescription + testMoreDescription,
        } as IResortInfo;

        render(<ResortInfoBlock />);

        await waitFor(() => {
            expect(screen.queryByTestId('resort-info')).toBeInTheDocument();
        });
    });

    it('should toggle map visibility on desktop when button is clicked', async () => {
        (window.matchMedia as jest.Mock).mockReturnValueOnce({ matches: false });

        await act(async () => {
            render(<ResortInfoBlock />);
        });

        const toggleButton = screen.getByTestId('show-map-button');
        fireEvent.click(toggleButton);

        await waitFor(() => {
            expect(mockStores.bookingStore.toggleMapVisibilityOnDesktop).toHaveBeenCalled();
        });
    });

    it('should toggle map visibility on mobile when button is clicked', async () => {
        await act(async () => {
            render(<ResortInfoBlock />);
        });

        const toggleButton = screen.getByTestId('show-map-button');
        fireEvent.click(toggleButton);

        await waitFor(() => {
            expect(mockStores.bookingStore.toggleMapVisibilityOnMobile).toHaveBeenCalled();
        });
    });

    it('should hide show-map-button if isHotelDetailsBrowsePagePreview', () => {
        mockStores.layoutStore.isHotelDetailsBrowsePagePreview = true;
        render(<ResortInfoBlock />);

        const toggleButton = screen.queryByTestId('show-map-button');

        expect(toggleButton).not.toBeInTheDocument();
    });

    describe('hotel address', () => {
        it('should convert UPPERCASE address parts to title case but leave postal code unchanged (non-browse page)', () => {
            mockStores.layoutStore.isHotelDetailsBrowsePage = false;
            mockStores.bookingStore.hotel = {
                address: 'MORRISON LINK',
                resort: { name: 'EDINBURGH CITY' },
                postalCode: 'EH3 8DN',
                country: { name: 'UNITED KINGDOM' },
            };

            render(<ResortInfoBlock />);

            const hotelAddress = screen.getByTestId('hotel-address');
            expect(hotelAddress).toHaveTextContent('Morrison Link, Edinburgh City, EH3 8DN, United Kingdom');
        });

        it('should convert UPPERCASE address parts to title case but leave postal code unchanged (browse page)', () => {
            const uppercaseHierarchy = {
                resort: { name: 'GRAN CANARIA' } as ILocationItem,
                country: { name: 'SPAIN' } as ILocationItem,
            };
            mockGetLocationHierarchy.mockReturnValue(uppercaseHierarchy);

            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            mockStores.layoutStore.layout = {
                sitecore: {
                    route: {
                        fields: {
                            Address: { value: 'PLAYA DEL INGLES' },
                            PostalCode: { value: 'GC-1 35100' },
                        },
                    },
                },
            } as any;

            render(<ResortInfoBlock />);

            const hotelAddress = screen.getByTestId('hotel-address');
            expect(hotelAddress).toHaveTextContent('Playa Del Ingles, Gran Canaria, GC-1 35100, Spain');
        });

        it('should NOT render hotel address if all address fields are missing', () => {
            mockStores.layoutStore.isHotelDetailsBrowsePage = false;
            mockStores.bookingStore.hotel = {
                address: '',
                resort: { name: '' },
            };

            render(<ResortInfoBlock />);

            const hotelAddress = screen.queryByTestId('hotel-address');
            expect(hotelAddress).not.toBeInTheDocument();
        });

        it('should NOT render hotel address if all address fields are missing on Hotel Details Browse Page', () => {
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            mockStores.layoutStore.layout = {
                sitecore: { route: { fields: { Address: { value: '' }, PostalCode: { value: '' } } } },
            } as any;
            mockGetLocationHierarchy.mockReturnValue({
                resort: { name: '' } as ILocationItem,
                country: { name: '' } as ILocationItem,
            });

            render(<ResortInfoBlock />);

            const hotelAddress = screen.queryByTestId('hotel-address');
            expect(hotelAddress).not.toBeInTheDocument();
        });
    });
});

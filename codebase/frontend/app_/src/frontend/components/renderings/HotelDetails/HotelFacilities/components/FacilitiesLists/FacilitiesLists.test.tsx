import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import settings from 'code/settings';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { IFacilityGroup } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { VirtualFacilityGroupCode } from 'models/enum/VirtualFacilityGroupCode';

import { FacilitiesLists } from './FacilitiesLists';

const createProps = () => ({
    facilityGroups: [
        {
            id: '1',
            name: 'Group-1',
            iconUrl: 'GroupIcon-1',
            items: [
                { code: 'Facility_1', name: 'Facility_1' },
                { code: 'Facility_2', name: 'Facility_2' },
                { code: 'Facility_3', name: 'Facility_3' },
            ],
        },
        {
            id: '2',
            name: 'Group-2',
            iconUrl: 'GroupIcon-2',
            items: [
                { code: 'Facility_5', name: 'Facility_5' },
                { code: 'Facility_6', name: 'Facility_6' },
                { code: 'Facility_7', name: 'Facility_7' },
                { code: 'Facility_8', name: 'Facility_8' },
            ],
        },
    ] as IFacilityGroup[],
});
const createStores = () => ({
    appStore: { isScreenExtraSmall: false },
    layoutStore: { getPhrase: jest.fn(p => p), setIsBodyScrollLocked: jest.fn() },
});

let props;
let mockStores = createStores();

jest.mock('frontend/utils/ui.utils', () => ({
    prepareBodyScrollLock: jest.fn(),
    lockBodyScroll: jest.fn(),
    scrollToElement: jest.fn(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFacilitiesListGroup = jest.fn();
jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FacilitiesLists/FacilitiesListGroup',
    () => props => {
        mockFacilitiesListGroup(props);

        return <div data-tid='facilities-list-group' />;
    },
);

const mockShowMoreButton = jest.fn();
jest.mock('frontend/components/common/ReadMoreButton', () => props => {
    mockShowMoreButton(props);

    return <button data-tid='read-more-button' />;
});

describe('<FacilitiesLists />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    describe('Desktop View', () => {
        it('should render all facilities groups', () => {
            const { container } = render(<FacilitiesLists {...props} />);
            const lists = container.querySelector('.hotel-facilities__lists') as Element;

            expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
                SitecoreDictionary.HotelInfoLabelsFacilitiesAndAmenities,
            );
            expect(lists.children).toHaveLength(props.facilityGroups.length);
            expect(screen.getByText(SitecoreDictionary.HotelInfoLabelsFacilitiesDisclaimer)).toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.HotelInfoLabelsShowMore)).not.toBeInTheDocument();
            expect(screen.getByTestId('facilities-lists')).not.toHaveClass('print');
        });

        it('should filter out Overview group', () => {
            props.facilityGroups = [
                {
                    id: '1',
                    code: VirtualFacilityGroupCode.Overview,
                    name: 'Overview',
                    iconUrl: 'OverviewIcon',
                    items: [
                        { code: 'Overview_1', name: 'Overview_1' },
                        { code: 'Overview_2', name: 'Overview_2' },
                    ],
                },
                {
                    id: '2',
                    name: 'Group-2',
                    iconUrl: 'GroupIcon-2',
                    items: [
                        { code: 'Facility_5', name: 'Facility_5' },
                        { code: 'Facility_6', name: 'Facility_6' },
                    ],
                },
            ] as IFacilityGroup[];

            render(<FacilitiesLists {...props} />);

            expect(mockFacilitiesListGroup).toHaveBeenCalledTimes(1);
        });

        it('should render Read More Button', () => {
            props.facilityGroups[0].items = new Array(10).fill({ code: 'test', name: 'test' });
            render(<FacilitiesLists {...props} />);

            expect(screen.getByTestId('read-more-button')).toBeInTheDocument();
            expect(mockShowMoreButton).toHaveBeenCalledWith({
                dataTid: 'show-more-facilities',
                isReadLess: false,
                onClick: expect.any(Function),
                readLessText: SitecoreDictionary.HotelInfoLabelsShowLess,
                readMoreText: SitecoreDictionary.HotelInfoLabelsShowMore,
            });
        });

        it('should not render Read More Button when showOnPrintOnly is true', () => {
            props.facilityGroups[0].items = new Array(10).fill({ code: 'test', name: 'test' });
            props.showOnPrintOnly = true;
            render(<FacilitiesLists {...props} />);
            expect(screen.getByTestId('facilities-lists')).toHaveClass('print');
            expect(screen.queryByTestId('read-more-button')).not.toBeInTheDocument();
            expect(mockFacilitiesListGroup).toHaveBeenCalledWith(
                expect.objectContaining({
                    showOnlyFirstN: false,
                }),
            );
        });
    });

    describe('Mobile View', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenExtraSmall = true;
        });

        it('should render title, items preview, disclaimer and drawer', () => {
            const { container } = render(<FacilitiesLists {...props} />);
            const previewList = container.querySelector('.hotel-facilities__lists--preview') as Element;

            expect(previewList.children.length).toBeLessThanOrEqual(
                settings.HotelDetails.FacilitiesPreviewAmountOnMobile,
            );
            expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
                SitecoreDictionary.HotelInfoLabelsFacilitiesAndAmenities,
            );
            expect(screen.getByText(SitecoreDictionary.HotelInfoLabelsFacilitiesDisclaimer)).toBeInTheDocument();

            const drawer = container.querySelector('.drawer') as HTMLElement;
            expect(
                within(drawer).getByText(SitecoreDictionary.HotelInfoLabelsFacilitiesDrawerHeading),
            ).toBeInTheDocument();
            expect(drawer.querySelector('.hotel-facilities__lists')?.children).toHaveLength(
                props.facilityGroups.length,
            );
        });

        it('should open/close drawer', async () => {
            const { container } = render(<FacilitiesLists {...props} />);
            const openBtn = screen.getByRole('button', {
                name: SitecoreDictionary.HotelInfoLabelsFacilitiesShowAllOnMobile,
            });
            const drawer = container.querySelector('.drawer') as HTMLElement;

            expect(drawer).not.toHaveClass('drawer--open');

            await userEvent.click(openBtn);
            expect(drawer).toHaveClass('drawer--open');

            const closeBtn = within(drawer).getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose });

            await userEvent.click(closeBtn);

            expect(drawer).not.toHaveClass('drawer--open');
            await waitFor(() => expect(scrollToElement).toBeCalledWith(container.firstChild, 10));
        });
    });
});

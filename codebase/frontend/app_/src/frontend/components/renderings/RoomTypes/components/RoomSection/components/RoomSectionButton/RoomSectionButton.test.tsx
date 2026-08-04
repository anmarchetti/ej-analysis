import * as React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomSectionButton, { IRoomSectionButtonProps } from './RoomSectionButton';

const mockShowMoreButtonComponent = jest.fn();

jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: props => {
        mockShowMoreButtonComponent(props);

        return <button data-tid='show-more-button' />;
    },
}));

jest.mock('frontend/components/icons-new/ExternalLink', () => ({
    __esModule: true,
    default: ({ className }) => <svg className={className} data-tid='icon-ext-link' />,
}));

const createStores = () => ({
    appStore: {
        isScreenMedium: true,
    },
    layoutStore: {
        isExtrasPage: false,
        getPhrase: jest.fn(p => p),
    },
});

const createProps = () =>
    ({
        isCollapsed: false,
        roomsCount: 3,
        visibleRoomsCount: 1,
        roomsToShowCount: 1,
        handleShowMore: jest.fn(),
        isOriginalRoomChanged: false,
    } as IRoomSectionButtonProps);

let mockStores;
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomSectionButton />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    describe('empty render', () => {
        it('Should NOT render button when roomsCount prop is less than 2', () => {
            props.roomsCount = 1;

            const { container } = render(<RoomSectionButton {...props} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('Should NOT render button when roomsCount prop is equal to 2 and visibleRoomsCount prop is equal to 0', () => {
            props.roomsCount = 1;
            props.visibleRoomsCount = 0;

            const { container } = render(<RoomSectionButton {...props} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    it('Should render Button component when isScreenMedium is false', () => {
        mockStores.appStore.isScreenMedium = false;

        render(<RoomSectionButton {...props} />);

        expect(screen.getByRole('button', { name: SitecoreDictionary.RoomTypesButtonsShowMore })).toHaveAttribute(
            'data-tid',
            'show-more-rooms-button-mobile',
        );
        expect(screen.getByTestId('icon-ext-link').classList.contains('icon-external-link')).toBe(true);
    });

    it('Should render ShowMoreButton component when isScreenMedium is true', () => {
        render(<RoomSectionButton {...props} />);

        expect(screen.getByRole('button')).toHaveAttribute('data-tid', 'show-more-button');
        expect(mockShowMoreButtonComponent).toHaveBeenCalledWith({
            onClick: props.handleShowMore,
            isChevronUp: true,
            title: SitecoreDictionary.RoomTypesButtonsShowLess,
            dataTid: 'show-more-rooms-button-desktop',
        });
    });

    it('Should render ShowMoreButton component with specific props when isCollapsed prop is true', () => {
        props.isCollapsed = true;

        render(<RoomSectionButton {...props} />);

        expect(screen.getByRole('button')).toHaveAttribute('data-tid', 'show-more-button');
        expect(mockShowMoreButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isChevronUp: false,
                title: SitecoreDictionary.RoomTypesButtonsShowMore,
            }),
        );
    });

    describe('render on extras page', () => {
        beforeEach(() => {
            mockStores.layoutStore.isExtrasPage = true;
        });

        it('Should render ShowMoreButton component with specific props when isCollapsed prop is false', () => {
            render(<RoomSectionButton {...props} />);

            expect(screen.getByRole('button')).toHaveAttribute('data-tid', 'show-more-button');
            expect(mockShowMoreButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: true,
                    title: SitecoreDictionary.RoomTypesButtonsShowLess,
                }),
            );
        });

        it('Should render ShowMoreButton component with specific props when isCollapsed prop is true', () => {
            props.isCollapsed = true;

            render(<RoomSectionButton {...props} />);

            expect(screen.getByRole('button')).toHaveAttribute('data-tid', 'show-more-button');
            expect(mockShowMoreButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: false,
                    title: SitecoreDictionary.RoomTypesLabelsEditRoom,
                }),
            );
        });

        it('Should render Button component with RoomTypesLabelsEditRoom title when isScreenMedium is false', () => {
            mockStores.appStore.isScreenMedium = false;

            render(<RoomSectionButton {...props} />);

            expect(screen.getByRole('button', { name: SitecoreDictionary.RoomTypesLabelsEditRoom })).toHaveAttribute(
                'data-tid',
                'show-more-rooms-button-mobile',
            );
        });
    });
});

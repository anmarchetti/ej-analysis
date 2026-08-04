import React from 'react';
import { render, screen } from '@testing-library/react';

import { MediaSize } from 'models/data/MediaSizeParams';
import InformationTilesItem, {
    IInformationTilesItemProps,
} from 'frontend/components/renderings/InformationTiles/components/InformationTilesItem';

const createStores = () => ({
    layoutStore: { isEditMode: false },
    appStore: { isScreenLessMedium: false },
});

let mockStores = createStores();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text-with-links'>{field.value}</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

let mockProps: IInformationTilesItemProps;

describe('InformationTilesItem', () => {
    beforeEach(() => {
        mockProps = {
            fields: {
                Icon: { value: { src: 'Icon' } },
                Title: {
                    value: 'Title',
                },
                Description: {
                    value: 'Description',
                },
            },
            iconSize: 20,
            className: 'test-class',
        };
        mockStores = createStores();
    });

    it('Should render', () => {
        const { container } = render(<InformationTilesItem {...mockProps} />);

        expect(container.getElementsByClassName('information-tiles-item').length).toBe(1);
        expect(container.getElementsByClassName('item-icon')).toBeTruthy();
        expect(container.getElementsByClassName('item-title')).toBeTruthy();
        expect(container.getElementsByClassName('item-description')).toBeTruthy();

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Icon,
                width: 20,
                height: 20,
                mediaSize: MediaSize.Small,
            }),
        );

        expect(container.getElementsByClassName('item-header item-header--title-under-icon')).toBeTruthy();
        expect(screen.queryByTestId('rich-text-with-links')).toBeInTheDocument();
    });

    it('Should render component with default icon size', () => {
        mockProps.iconSize = undefined;
        render(<InformationTilesItem {...mockProps} />);

        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Icon,
                width: 55,
                height: 55,
                mediaSize: MediaSize.Small,
            }),
        );
    });

    it('Should NOT render RichTextWithLinks when the description is empty', () => {
        mockProps.fields.Description = undefined;

        render(<InformationTilesItem {...mockProps} />);

        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('Should render title under icon', () => {
        mockProps.isTitleUnderIcon = true;

        const { container } = render(<InformationTilesItem {...mockProps} />);

        expect(container.querySelector('.item-header--title-under-icon')).toBeInTheDocument();
    });

    it('Should NOT render title under icon', () => {
        mockProps.isTitleUnderIcon = false;

        const { container } = render(<InformationTilesItem {...mockProps} />);

        expect(container.querySelector('.item-header--title-under-icon')).not.toBeInTheDocument();
    });

    it('Should NOT render icon without src in default mode', () => {
        mockProps.fields.Icon.value.src = '';
        mockStores.layoutStore.isEditMode = false;

        const { container } = render(<InformationTilesItem {...mockProps} />);

        expect(container.querySelector('.item-icon')).not.toBeInTheDocument();
    });

    it('Should render icon without src in edit mode', () => {
        mockProps.fields.Icon.value.src = '';
        mockStores.layoutStore.isEditMode = true;

        const { container } = render(<InformationTilesItem {...mockProps} />);

        expect(container.querySelector('.item-icon')).toBeInTheDocument();
    });

    it('Should render title on content block NOT under icon', () => {
        mockProps.isDefaultTheme = true;

        const { container } = render(<InformationTilesItem {...mockProps} />);

        expect(container.querySelector('.item-header .item-title')).not.toBeInTheDocument();
        expect(container.querySelector('.information-tiles-item .content .item-title')).toBeInTheDocument();
    });

    it('Should render title under icon', () => {
        mockProps.isDefaultTheme = false;

        const { container } = render(<InformationTilesItem {...mockProps} />);

        expect(container.querySelector('.item-header .item-title')).toBeInTheDocument();
        expect(container.querySelector('.information-tiles-item .content .item-title')).not.toBeInTheDocument();
    });

    it('Should render component with passed className', () => {
        const { container } = render(<InformationTilesItem {...mockProps} />);

        const tileElement = container.getElementsByClassName('information-tiles-item')[0];
        expect(tileElement).toHaveClass('test-class');
    });
});

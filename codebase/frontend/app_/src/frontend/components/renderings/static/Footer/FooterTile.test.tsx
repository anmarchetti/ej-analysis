import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { FooterTile, TFooterTileProps } from './FooterTile';

const mockPlaceholderProps = jest.fn();
const mockTextProps = jest.fn();
const mockPlaceholderLinkClickDestination = 'dest';
const mockPlaceholderLinkClickName = 'name';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: ({ onLinkClick, ...props }) => {
        mockPlaceholderProps(props);

        return (
            <div
                data-tid='placeholder'
                onClick={() =>
                    onLinkClick(
                        mockSitecoreField(
                            mockSitecoreLinkField(mockPlaceholderLinkClickDestination, mockPlaceholderLinkClickName),
                        ),
                    )
                }
            />
        );
    },
    Text: props => {
        mockTextProps(props);

        return <div data-tid='text' />;
    },
}));

const mockRichTextProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ onLinkClick, ...props }) => {
        mockRichTextProps(props);

        return <div data-tid='rich-text-with-links' onClick={onLinkClick} />;
    },
}));

const resetMocks = (): TFooterTileProps => ({
    fields: {
        Title: mockSitecoreField(' Title'),
        Description: mockSitecoreField(' Description'),
    },
    params: {},
    rendering: {},
});

const createStores = () => ({
    trackingStore: {
        trackHomepageAction: jest.fn(),
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FooterTile />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createStores();
    });

    it('should not render', () => {
        mockProps.fields = null;
        const { container } = render(<FooterTile {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard', () => {
        mockProps.rendering = { placeholders: { [PlaceholderNames.Image]: ['test'] } };
        const { container } = render(<FooterTile {...mockProps} />);

        expect(container.querySelector('.footer-tile')).toBeInTheDocument();
        expect(container.querySelector('.footer-tile__images')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: 'image',
            rendering: mockProps.rendering,
            width: 64,
            height: 64,
            mediaSize: MediaSize.Small,
        });

        expect(container.querySelector('.footer-tile__text')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Title,
                tag: 'h4',
                className: 'footer-tile__title',
            }),
        );

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextProps).toHaveBeenCalledWith({
            field: mockProps.fields.Description,
        });
    });

    it('should NOT render title when Title field not defined', () => {
        mockProps.fields.Title = null;
        render(<FooterTile {...mockProps} />);

        expect(screen.queryByTestId('text')).not.toBeInTheDocument();
    });

    it('should NOT render description when Description field not defined', () => {
        mockProps.fields.Description = null;
        render(<FooterTile {...mockProps} />);

        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('should call handleClickLink when click on RichTextWithLinks', () => {
        render(<FooterTile {...mockProps} />);

        const mockDestination = 'dest';
        const mockName = 'name';

        fireEvent.click(screen.getByTestId('rich-text-with-links'), {
            target: { href: mockDestination, innerText: mockName },
        });

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.FooterClick, {
            location: 'Footer',
            position: '',
            name: mockName,
            destination: mockDestination,
            section: mockProps.fields.Title.value,
        });
    });

    it('should call handleClickImage', () => {
        render(<FooterTile {...mockProps} />);

        fireEvent.click(screen.getByTestId('placeholder'));

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.FooterClick, {
            location: 'Footer',
            position: '',
            name: mockPlaceholderLinkClickName,
            destination: mockPlaceholderLinkClickDestination,
            section: mockProps.fields.Title.value,
        });
    });
});

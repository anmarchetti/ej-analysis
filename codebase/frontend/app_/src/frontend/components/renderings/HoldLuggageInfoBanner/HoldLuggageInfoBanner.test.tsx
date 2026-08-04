import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import HoldLuggageInfoBanner, { THoldLuggageInfoBannerProps } from './HoldLuggageInfoBanner';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockInfoBlock = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlock(props);

        return <div data-tid='info-block' />;
    },
}));

const createProps = (): THoldLuggageInfoBannerProps => ({
    fields: {
        items: [
            {
                fields: {
                    Key: mockSitecoreField('luxury'),
                    Title: mockSitecoreField('Luxury Luggage'),
                    Description: mockSitecoreField('Enjoy our luxury luggage service.'),
                    Icon: mockSitecoreField(mockSitecoreImageField('/path/to/icon.png', 'Icon')),
                    Link: mockSitecoreField(
                        mockSitecoreLinkField('/luxury-luggage', 'Learn more', SitecoreLinkType.Internal),
                    ),
                },
                displayName: 'Luxury Luggage Item',
                id: 'luxury-luggage-item',
                name: 'LuxuryLuggageItem',
            },
            {
                fields: {
                    Key: mockSitecoreField(''),
                    Title: mockSitecoreField('Standard Luggage'),
                    Description: mockSitecoreField('Standard luggage service available.'),
                    Icon: mockSitecoreField(mockSitecoreImageField('/path/to/standard-icon.png', 'Standard Icon')),
                    Link: mockSitecoreField(
                        mockSitecoreLinkField('/standard-luggage', 'Learn more', SitecoreLinkType.Internal),
                    ),
                },
                displayName: 'Standard Luggage Item',
                id: 'standard-luggage-item',
                name: 'StandardLuggageItem',
            },
        ],
    },
    rendering: {},
    params: {},
});

const createStores = () =>
    createMockStores({
        layoutStore: { isConfirmationPage: false },
        bookingStore: {
            isLuxuryPackage: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

describe('<HoldLuggageInfoBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render Hold Luggage Info Block Banner with default content when it is NOT luxury package', () => {
        render(<HoldLuggageInfoBanner {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();

        const { Title, Description, Icon, Link } = mockProps.fields!.items[1].fields;
        expect(mockInfoBlock).toHaveBeenCalledWith({
            title: Title,
            text: Description,
            icon: Icon,
            link: Link,
            className: 'infoBlock',
            btnClass: 'button',
        });
    });

    it('should render Hold Luggage Info Block Banner with luxury content when it is luxury package', () => {
        mockStores.bookingStore.isLuxuryPackage = true;
        render(<HoldLuggageInfoBanner {...mockProps} />);

        expect(screen.getByTestId('info-block')).toBeInTheDocument();

        const { Title, Description, Icon, Link } = mockProps.fields!.items[0].fields;
        expect(mockInfoBlock).toHaveBeenCalledWith({
            title: Title,
            text: Description,
            icon: Icon,
            link: Link,
            className: 'infoBlock',
            btnClass: 'button',
        });
    });

    it('should render component with right className on confirmation page', () => {
        mockStores.layoutStore.isConfirmationPage = true;
        render(<HoldLuggageInfoBanner {...mockProps} />);

        const { Title, Description, Icon, Link } = mockProps.fields!.items[1].fields;
        expect(mockInfoBlock).toHaveBeenCalledWith({
            title: Title,
            text: Description,
            icon: Icon,
            link: Link,
            className: 'infoBlock',
            btnClass: 'button confirmationButton',
        });
    });

    it('should NOT render Hold Luggage Info Block Banner when fields are NOT defined', () => {
        mockProps.fields = undefined;
        render(<HoldLuggageInfoBanner {...mockProps} />);

        expect(screen.queryByTestId('info-block')).not.toBeInTheDocument();
    });

    it('should NOT render Hold Luggage Info Block Banner when items are NOT defined', () => {
        mockProps.fields!.items = [];
        render(<HoldLuggageInfoBanner {...mockProps} />);

        expect(screen.queryByTestId('info-block')).not.toBeInTheDocument();
    });

    it('should NOT render Hold Luggage Info Block Banner when items do not match luxury or standard luggage', () => {
        mockProps.fields!.items = [
            {
                fields: {
                    Key: { value: 'other' },
                    Title: { value: 'Other Luggage' },
                    Description: { value: 'Other luggage service available.' },
                    Icon: { value: { src: '/path/to/other-icon.png', alt: 'Other Icon' } },
                    Link: {
                        value: { href: '/other-luggage', text: 'Learn more', linktype: SitecoreLinkType.Internal },
                    },
                },
                displayName: 'Other Luggage Item',
                id: 'other-luggage-item',
                name: 'OtherLuggageItem',
            },
        ];
        render(<HoldLuggageInfoBanner {...mockProps} />);

        expect(screen.queryByTestId('info-block')).not.toBeInTheDocument();
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import AncillariesMainContent, { TAncillariesMainContentProps } from './AncillariesMainContent';

const createProps = (): TAncillariesMainContentProps => ({
    Description: mockSitecoreField('description'),
    Icon: mockSitecoreField(mockSitecoreImageField('icon')),
    Subtitle: mockSitecoreField('subtitle'),
    dataTid: 'promo',
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImage = jest.fn();

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid='jss-text' />;
    },
}));

const mockRichTextWithLinksProps = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
    },
}));

describe('<AncillariesMainContent />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render default component', () => {
        render(<AncillariesMainContent {...mockProps} />);

        expect(screen.getByTestId('promo')).toHaveClass('promo');

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImage).toHaveBeenCalledWith({
            field: mockProps.Icon,
            className: 'image',
            'data-tid': 'ancillaries-icon',
        });

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.Subtitle,
            tag: 'div',
            className: 'subtitle',
            'data-tid': 'ancillaries-subtitle',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.Description,
            tag: 'div',
            className: 'description',
            dataId: 'ancillaries-description',
        });
    });

    it('should render component with right classes on post booking page', () => {
        mockStores.layoutStore.isPostBookingPages = true;
        render(<AncillariesMainContent {...mockProps} />);

        expect(screen.getByTestId('promo')).toHaveClass('promoPostBooking');

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.Subtitle,
            tag: 'div',
            className: 'altSubtitle',
            'data-tid': 'ancillaries-subtitle',
        });
    });
});

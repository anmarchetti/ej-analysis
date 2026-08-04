import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import NeedToKnow from './NeedToKnow';

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Description: mockSitecoreField('Description'),
        Subtitle: mockSitecoreField('Subtitle'),
        ViewGallery: mockSitecoreField('ViewGallery'),
        Images: [{ fields: { Image: { value: { src: 'image' } } } }],
        Information: [
            {
                id: 'abc12',
                fields: {
                    InformationContent: mockSitecoreField('InformationContent'),
                    InformationSmallPrint: mockSitecoreField('InformationSmallPrint'),
                    InformationIcon: { value: { src: 'icon' } },
                },
            },
            {
                id: '123abc',
                fields: {
                    InformationContent: mockSitecoreField('InformationContent'),
                    InformationSmallPrint: mockSitecoreField(''),
                    InformationIcon: { value: { src: 'icon' } },
                },
            },
        ],
    },
});
let mockProps;

const createStores = () => createMockStores();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/HotelDetails/HotelImageCarousel/components/FullScreenImageCarousel', () => ({
    __esModule: true,
    default: ({ onClose }) => <div data-tid='full-screen-image-carousel' onClick={onClose} />,
}));

const mockImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: ({ field }) => {
        mockImageProps(field);

        return <div data-tid='image'>{field.value.src}</div>;
    },
}));

describe('<NeedToKnow />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('Given Image Gallery Exists', () => {
        it('should render component title', () => {
            const { getByText } = render(<NeedToKnow {...mockProps} />);
            expect(getByText(mockProps.fields.Title.value)).toBeInTheDocument();
        });

        it('should render image', () => {
            mockProps.fields.ViewGallery = undefined;
            mockProps.fields.Information = [];
            render(<NeedToKnow {...mockProps} />);
            expect(screen.getByTestId('image')).toBeInTheDocument();
            expect(mockImageProps).toHaveBeenCalledWith({ value: { src: 'image' } });
        });

        it('should render component description', () => {
            const { getByText } = render(<NeedToKnow {...mockProps} />);
            expect(getByText(mockProps.fields.Description.value)).toBeInTheDocument();
        });

        it('should show view gallery panel', () => {
            const { getByTestId } = render(<NeedToKnow {...mockProps} />);
            expect(getByTestId('need-to-know-gallery')).toBeInTheDocument();
        });

        it('should render component ViewGallery Text', () => {
            const { getByText } = render(<NeedToKnow {...mockProps} />);
            expect(getByText(mockProps.fields.ViewGallery.value)).toBeInTheDocument();
        });

        it('should show gallery on click of gallery panel', async () => {
            const { getByTestId } = render(<NeedToKnow {...mockProps} />);
            await userEvent.click(getByTestId('need-to-know-gallery'));
            expect(getByTestId('full-screen-image-carousel')).toBeInTheDocument();
        });

        it('should close full screen carousel', async () => {
            const { getByTestId, queryByTestId } = render(<NeedToKnow {...mockProps} />);
            await userEvent.click(getByTestId('need-to-know-gallery'));
            expect(getByTestId('full-screen-image-carousel')).toBeInTheDocument();
            await userEvent.click(getByTestId('full-screen-image-carousel'));
            expect(queryByTestId('full-screen-image-carousel')).not.toBeInTheDocument();
        });
    });

    describe('Given Image Gallery does not exist', () => {
        it('should NOT render component title', () => {
            mockProps.fields.Images = [];
            const { queryByText } = render(<NeedToKnow {...mockProps} />);
            expect(queryByText(mockProps.fields.Title.value)).not.toBeInTheDocument();
        });

        it('should NOT render component description', () => {
            mockProps.fields.Images = [];
            const { queryByText } = render(<NeedToKnow {...mockProps} />);
            expect(queryByText(mockProps.fields.Description.value)).not.toBeInTheDocument();
        });

        it('should NOT show view gallery panel', () => {
            mockProps.fields.Images = [];
            const { queryByText } = render(<NeedToKnow {...mockProps} />);
            expect(queryByText('imageGallery')).not.toBeInTheDocument();
        });
    });

    describe('Given Information Exists', () => {
        it('should render component sub title', () => {
            const { getByText } = render(<NeedToKnow {...mockProps} />);
            expect(getByText(mockProps.fields.Subtitle.value)).toBeInTheDocument();
        });

        it('should show Information content', () => {
            const { getAllByText } = render(<NeedToKnow {...mockProps} />);
            expect(getAllByText(mockProps.fields.Information[0].fields.InformationContent.value)).toHaveLength(2);
        });

        it('should show Information small print', () => {
            const { getAllByText } = render(<NeedToKnow {...mockProps} />);
            expect(getAllByText(mockProps.fields.Information[0].fields.InformationSmallPrint.value)).toHaveLength(1);
        });
    });

    describe('Given Information do not Exists', () => {
        it('should NOT render component sub title', () => {
            mockProps.fields.Information = [];
            const { queryByText } = render(<NeedToKnow {...mockProps} />);
            expect(queryByText(mockProps.fields.Subtitle.value)).not.toBeInTheDocument();
        });

        it('should NOT show Information content', () => {
            mockProps.fields.Information = [];
            const { queryByText } = render(<NeedToKnow {...mockProps} />);
            expect(queryByText('InformationContent')).not.toBeInTheDocument();
        });

        it('should NOT show Information small print', () => {
            mockProps.fields.Information = [];
            const { queryByText } = render(<NeedToKnow {...mockProps} />);
            expect(queryByText('InformationSmallPrint')).not.toBeInTheDocument();
        });
    });
});

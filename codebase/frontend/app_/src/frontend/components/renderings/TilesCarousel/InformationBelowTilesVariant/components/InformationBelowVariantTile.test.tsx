import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import InformationBelowVariantTile, { IInformationBelowVariantTileProps } from './InformationBelowVariantTile';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='text'>{field.value}</div>,
}));

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: () => <div data-tid='jss-image-next' />,
}));

jest.mock(
    'frontend/components/renderings/TilesCarousel/InformationBelowTilesVariant/components/DescriptionContainer',
    () => ({
        __esModule: true,
        default: () => <div data-tid='description-container' />,
    }),
);

jest.mock('frontend/components/common/Button/Button', () => ({
    __esModule: true,
    default: ({ onClick, children }) => (
        <button onClick={onClick} onKeyDown={() => jest.fn()} data-tid='button'>
            {children}
        </button>
    ),
}));

let mockProps: IInformationBelowVariantTileProps;

describe('<InformationBelowVariantTile />', () => {
    beforeEach(() => {
        mockProps = {
            Title: mockSitecoreField('Title'),
            Image: mockSitecoreField(mockSitecoreImageField('Image')),
            Description: mockSitecoreField('Description'),
            Subtitle: mockSitecoreField('Subtitle'),
            onClick: jest.fn(),
            isActive: false,
        };
    });

    it('should render non active button, image and title when includeDescription is NOT true', () => {
        render(<InformationBelowVariantTile {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toHaveTextContent('Title');
        expect(screen.getByTestId('separate-description-tile-wrapper')).toHaveClass('container');
    });

    it('should render active button, image and DescriptionContainer when includeDescription is true', () => {
        mockProps.includeDescription = true;
        mockProps.isActive = true;

        render(<InformationBelowVariantTile {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByTestId('description-container')).toBeInTheDocument();
        expect(screen.getByTestId('separate-description-tile-wrapper')).toHaveClass('container active');
    });
});

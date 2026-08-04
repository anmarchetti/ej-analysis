import React from 'react';
import { render, screen } from '@testing-library/react';

import SocialMediaContent from './SocialMediaContent';

const createProps = () => ({
    downloadPoster: jest.fn(),
    hasEjLogo: false,
    hasUMLogo: false,
    logoImage: { value: 'logo-image' },
    posterFields: { Title: { value: 'title' }, Tiles: ['tile', 'tile', 'tile', 'tile'] },
    posterId: 'poster-id',
    posterName: 'poster-name',
    toggleEjLogo: jest.fn(),
    toggleUMLogo: jest.fn(),
    UMLogoImage: 'um-logo-image',
});

let mockProps;

jest.mock('frontend/components/renderings/SocialMediaContent/components/PosterLayout/PosterLayout', () => ({
    __esModule: true,
    default: () => <div data-tid='poster-layout' />,
}));

describe('<SocialMediaContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render poster layout', () => {
        render(<SocialMediaContent {...mockProps} />);

        expect(screen.getByTestId('poster-layout')).toBeInTheDocument();
    });
});

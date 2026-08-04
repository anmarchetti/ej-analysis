import React from 'react';
import { render, screen } from '@testing-library/react';

import { ENGLISH } from 'code/cmsLang';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IHeroBannerHeadingFields } from 'models/data/IHeroBanner';

import FloatingBannerTitle from './FloatingBannerTitle';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IHeroBannerHeadingFields => ({
    ComposedTitle: mockSitecoreField('ComposedTitle'),
    Name: mockSitecoreField('Name'),
    Subtitle: mockSitecoreField('Subtitle'),
    Title: mockSitecoreField('Title'),
});
const createStores = () => ({
    layoutStore: {
        lang: 'ch-fr',
    },
});

let mockProps;
let mockStores;

describe('BannerTitle', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render ComposedTitle on not EN website when ComposedTitle is exist', () => {
        render(<FloatingBannerTitle {...mockProps} />);

        expect(screen.getByText(mockProps.ComposedTitle.value)).toBeInTheDocument();
    });

    it('should NOT render ComposedTitle on not EN website when ComposedTitle is absent', () => {
        mockProps.ComposedTitle = undefined;
        render(<FloatingBannerTitle {...mockProps} />);

        expect(screen.getByText(`${mockProps.Title.value} ${mockProps.Subtitle.value}`)).toBeInTheDocument();
    });

    it('should render title and subtitle on EN website', () => {
        mockStores.layoutStore.lang = ENGLISH;
        render(<FloatingBannerTitle {...mockProps} />);

        expect(screen.getByText(`${mockProps.Title.value} ${mockProps.Subtitle.value}`)).toBeInTheDocument();
    });

    it('should render name and subtitle on EN website when title is absent', () => {
        mockStores.layoutStore.lang = ENGLISH;
        mockProps.Title = undefined;

        render(<FloatingBannerTitle {...mockProps} />);
        expect(screen.getByText(`${mockProps.Name.value} ${mockProps.Subtitle.value}`)).toBeInTheDocument();
    });

    it('should render floating-banner-title with className from props', () => {
        mockProps.className = 'custom-class';

        render(<FloatingBannerTitle {...mockProps} />);

        expect(screen.getByTestId('floating-banner-title')).toHaveClass('title custom-class');
    });
});

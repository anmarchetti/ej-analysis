import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreLangOption } from 'frontend/components/renderings/LanguageSelector/__mocks__/languageSelector.mocks';

import { LanguageOption } from './LanguageOption';

const createProps = () => ({
    isSelected: false,
    item: mockSitecoreLangOption('en'),
    onSelect: jest.fn(),
});

let mockProps = createProps();

describe('<LanguageOption />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Should render option with icon', () => {
        render(<LanguageOption {...mockProps} />);

        expect(screen.getByRole('radio', { name: mockProps.item.fields.Title.value })).toBeVisible();
        expect(screen.getByRole('presentation')).toHaveAttribute('src', mockProps.item.fields.Icon.value.src);
    });

    it('Should not render option when fields not undefined', () => {
        mockProps.item.fields = undefined as any;
        render(<LanguageOption {...mockProps} />);

        expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('Should render option without icon', () => {
        mockProps.item.fields = undefined as any;
        render(<LanguageOption {...mockProps} />);

        expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });
});

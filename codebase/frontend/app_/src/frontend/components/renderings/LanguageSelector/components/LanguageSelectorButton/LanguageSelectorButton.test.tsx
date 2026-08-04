import React from 'react';
import { render, screen } from '@testing-library/react';

import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockSitecoreLangOption } from 'frontend/components/renderings/LanguageSelector/__mocks__/languageSelector.mocks';

import { LanguageSelectorButton } from './LanguageSelectorButton';

const createProps = () => ({
    langOption: mockSitecoreLangOption('en'),
    onClick: jest.fn(),
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
});

let mockProps = createProps();
let mockStores = createStores();

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

describe('<LanguageSelectorButton />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render button with IconCircle', () => {
        render(<LanguageSelectorButton {...mockProps} />);

        expect(
            screen.getByRole('button', { name: SitecoreDictionary.GlobalsLabelsChooseLanguage }),
        ).toBeInTheDocument();

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.langOption.fields.IconCircle,
                fill: true,
                mediaSize: MediaSize.Small,
            }),
        );
    });

    it('Should render button with Icon', () => {
        mockProps.langOption.fields.IconCircle = undefined as any;

        render(<LanguageSelectorButton {...mockProps} />);

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.langOption.fields.Icon,
                fill: true,
            }),
        );
    });

    it('Should render button without icon', () => {
        mockProps.langOption = undefined as any;

        render(<LanguageSelectorButton {...mockProps} />);

        expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });
});

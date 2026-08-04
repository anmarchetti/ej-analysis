import React from 'react';
import { render } from '@testing-library/react';

import * as fontsUtils from 'frontend/components/common/FontsLoader/fonts.utils';
import FontsLoader from 'frontend/components/common/FontsLoader/FontsLoader';

const createProps = () => ({
    fontsConfig: [{ family: 'family', urls: { woff2: 'woff2' }, criticalSubset: { urls: { woff2: 'woff' } } }] as any,
});

let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<FontsLoader />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockProps = createProps();
    });

    it('Should NOT render', () => {
        const { container } = render(<FontsLoader {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should call getFontFaceAtRule and loadFont once', () => {
        const spyGetFontFace = jest.spyOn(fontsUtils, 'getFontFaceAtRule');
        const spyLoadFont = jest.spyOn(fontsUtils, 'loadFont');
        render(<FontsLoader {...mockProps} />);

        expect(spyGetFontFace).toBeCalledTimes(1);
        expect(spyLoadFont).toBeCalledTimes(1);
    });

    it('Should NOT call loadFont when no fonts', () => {
        mockProps.fontsConfig = [];
        const spyLoadFont = jest.spyOn(fontsUtils, 'loadFont');
        render(<FontsLoader {...mockProps} />);

        expect(spyLoadFont).toBeCalledTimes(0);
    });

    it('Should NOT call getFontFaceAtRule when no criticalSubset', () => {
        mockProps.fontsConfig = [{ family: 'family', urls: { woff2: 'woff2' } }];
        const spyGetFontFace = jest.spyOn(fontsUtils, 'getFontFaceAtRule');
        render(<FontsLoader {...mockProps} />);

        expect(spyGetFontFace).toBeCalledTimes(0);
    });
});

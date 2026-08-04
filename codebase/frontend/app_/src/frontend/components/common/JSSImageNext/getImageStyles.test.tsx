import React from 'react';
import classnames from 'classnames';

import { ScreenBreakpoints } from 'code/screenBreakpoints';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { getImageStyles } from './getImageStyles';

import moduleStyles from './JSSImageNext.module.scss';

jest.mock('frontend/utils/string.utils', () => ({
    getHashCode: jest.fn().mockReturnValue(1),
}));

type TMocks = {
    fill: boolean;
    image?: ISitecoreField<ISitecoreImage>;
};

describe('getImageStyles', () => {
    const resetMocks = (): TMocks => ({
        image: mockSitecoreField(mockSitecoreImageField('image')),
        fill: true,
    });
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should return empty params', () => {
        mocks.image = undefined;
        expect(getImageStyles(mocks.image, mocks.fill)).toEqual({
            inlineStyles: undefined,
            styles: undefined,
            className: undefined,
        });
    });

    it('should return no extra styles if no focal points', () => {
        expect(getImageStyles(mocks.image, mocks.fill)).toEqual({
            inlineStyles: {
                objectPosition: undefined,
                objectFit: 'cover',
            },
            styles: undefined,
            className: undefined,
        });
    });

    it('should return only inline styles when desktop values equals to mobile values', () => {
        if (mocks.image) {
            mocks.image.value.dfx = 10;
            mocks.image.value.dfy = 20;
            mocks.image.value.mfx = 10;
            mocks.image.value.mfy = 20;
            expect(getImageStyles(mocks.image, mocks.fill)).toEqual({
                inlineStyles: {
                    objectPosition: `${mocks.image.value.dfx}% ${mocks.image.value.dfy}%`,
                    objectFit: 'cover',
                },
                styles: undefined,
                className: classnames(moduleStyles.jssImage),
            });
        }
    });

    it('should return only inline styles when desktop values equals to mobile values', () => {
        if (mocks.image) {
            mocks.image.value.dfx = 40;
            mocks.image.value.dfy = 40;

            const classes = [moduleStyles.img, moduleStyles.img + `-1`];
            const className = classnames(...classes);
            const imageClasses = '.' + classes.join('.');

            const styles = (
                <style>
                    {`
                    ${imageClasses} {
                        object-position: ${mocks.image.value.dfx}% ${mocks.image.value.dfy}%;
                    }
                    @media screen and (max-width: ${ScreenBreakpoints.SM}px) {
                        ${imageClasses} {
                            object-position: center center;
                        }
                    }
                `}
                </style>
            );
            expect(getImageStyles(mocks.image, mocks.fill)).toEqual({
                inlineStyles: undefined,
                styles,
                className,
            });
        }
    });
});

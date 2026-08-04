import classnames from 'classnames';

import { ScreenBreakpoints } from 'code/screenBreakpoints';
import { getHashCode } from 'frontend/utils/string.utils';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import moduleStyles from './JSSImageNext.module.scss';

/**
 * Creates styles for focal points
 * @param imageField ISitecoreImage field
 */
export const getImageStyles = (
    imageField: Nullable<ISitecoreField<ISitecoreImage>>,
    fill: boolean | undefined,
): {
    className?: string;
    inlineStyles?: {
        objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
        objectPosition: string | undefined;
    };
    styles?: JSX.Element;
} => {
    // generate unique hash number from image src to be later used in classname
    // TODO: possibly can use useId hook after upgrade to React 18
    const imageId = getHashCode(imageField?.value.src ?? '');

    // no need to add styles if no image
    if (!imageField || !fill) {
        return {};
    }

    const { dfx, dfy, mfx, mfy } = imageField.value || {};

    // return no extra styles if no focal points
    if (!dfx && !dfy && !mfx && !mfy) {
        return {
            inlineStyles: {
                objectPosition: undefined,
                // TODO: object-fit: cover is added to every image with layout='fill'. is this okay? any edge cases?
                objectFit: 'cover',
            },
            styles: undefined,
            className: undefined,
        };
    }

    // desktop values equals to mobile values, then we can return only inline styles
    if (!!dfx && !!dfy && dfx === mfx && dfy === mfy) {
        return {
            inlineStyles: { objectPosition: `${dfx}% ${dfy}%`, objectFit: 'cover' },
            styles: undefined,
            className: classnames(moduleStyles.jssImage),
        };
    }

    let styles: JSX.Element | undefined = undefined;
    let className: string | undefined = undefined;

    if ((dfx && dfy) || (mfx && mfy)) {
        const focalPoints = {
            d: {
                x: dfx ? `${dfx}%` : 'center',
                y: dfy ? `${dfy}%` : 'center',
            },
            m: {
                x: mfx ? `${mfx}%` : 'center',
                y: mfy ? `${mfy}%` : 'center',
            },
        };

        // create unique classnames that will persist hydration
        const classes = [moduleStyles.img, moduleStyles.img + `-${imageId}`];

        className = classnames(...classes);
        const imageClasses = '.' + classes.join('.');

        // create image styles to use for focal points
        styles = (
            <style>
                {`
                    ${imageClasses} {
                        object-position: ${focalPoints.d.x} ${focalPoints.d.y};
                    }
                    @media screen and (max-width: ${ScreenBreakpoints.SM}px) {
                        ${imageClasses} {
                            object-position: ${focalPoints.m.x} ${focalPoints.m.y};
                        }
                    }
                `}
            </style>
        );
    }

    return {
        inlineStyles: undefined,
        styles,
        className,
    };
};

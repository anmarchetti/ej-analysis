import React, { useEffect } from 'react';
import Head from 'next/head';

import { IFontTypeConfig } from 'code/fonts.config';

import { getFontFaceAtRule, loadFont } from './fonts.utils';

interface IFontsLoaderProps {
    fontsConfig: IFontTypeConfig[];
}

/**
 * Load fonts in 2 stages:
 * 1) Preload critical subset (it contains only letters/numbers).
 * 2) Load full font using CSS Font Loading API
 */
export const FontsLoader = ({ fontsConfig }: IFontsLoaderProps) => {
    const criticalFonts = fontsConfig.filter(f => !!f.criticalSubset?.urls);
    const criticalFontFaceCSS = criticalFonts
        .map(f => getFontFaceAtRule(f.family, f.criticalSubset!.urls, f.descriptors))
        .join('');

    useEffect(() => {
        // Stage 2. Load full font
        fontsConfig.forEach(f => loadFont(f));
    }, [fontsConfig]);

    return (
        <Head>
            {/* Stage 1. <link rel='preload'> and @font-face CSS for subsets  */}
            {criticalFonts.map(f => (
                <link
                    key={f.family}
                    rel='preload'
                    href={f.criticalSubset!.urls.woff2}
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                />
            ))}
            {!!criticalFontFaceCSS && (
                <style
                    type='text/css'
                    dangerouslySetInnerHTML={{
                        __html: criticalFontFaceCSS,
                    }}
                />
            )}
        </Head>
    );
};

export default FontsLoader;

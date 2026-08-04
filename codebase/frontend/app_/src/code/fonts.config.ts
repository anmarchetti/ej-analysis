import { envAll } from './env';

export interface IFontTypeUrls {
    woff?: string;
    woff2?: string;
}

export interface IFontTypeConfig {
    family: string;
    urls: IFontTypeUrls;
    criticalSubset?: {
        urls: IFontTypeUrls;
    };
    descriptors?: FontFaceDescriptors;
}

export const fontsUrl = (envAll.PUBLIC_URL ?? '') + (process.env.NEXT_PUBLIC_FONTS_URL ?? '');

export const fontsConfig: IFontTypeConfig[] = [
    {
        family: 'easyjet_generation_headline',
        urls: {
            woff2: `${fontsUrl}/easyJetGenerationHeadline.woff2`,
            woff: `${fontsUrl}/easyJetGenerationHeadline.woff`,
        },
        criticalSubset: {
            urls: {
                woff2: `${fontsUrl}/easyJetGenerationHeadline__subset.woff2`,
                woff: `${fontsUrl}/easyJetGenerationHeadline__subset.woff`,
            },
        },
    },
    {
        family: 'easyjet_rounded_headline',
        urls: {
            woff2: `${fontsUrl}/easyJetRoundedHeadline.woff2`,
            woff: `${fontsUrl}/easyJetRoundedHeadline.woff`,
        },
        criticalSubset: {
            urls: {
                woff2: `${fontsUrl}/easyJetRoundedHeadline__subset.woff2`,
                woff: `${fontsUrl}/easyJetRoundedHeadline__subset.woff`,
            },
        },
        descriptors: { weight: '400' },
    },
];

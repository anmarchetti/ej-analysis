import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { AxiosRequestConfig } from 'axios';

import { sitecoreUrls } from 'code/sitecoreUrls';
import { buildSitecorePath } from 'frontend/utils/buildSitecorePath';
import AxiosRequest from 'frontend/utils/request';

const getLayoutPath = (path: string): string =>
    decodeURIComponent(path)
        .replace(/[^\x00-\x7F]/g, '') // remove non-ascii
        .replace(/[()]/g, '')
        .replace('-&-', '-')
        .replace('--', '-')
        .replace('---', '-') // for hotels like "Corales Beach - Adults only"
        .replace('*', '')
        .replace('.', '')
        .replace('+', '');

export const getSitecorePlaceholderLayout = async (
    lang: string,
    path: string,
    placeholders: string | string[],
    axiosConfig?: AxiosRequestConfig,
): Promise<
    | {
          [key: string]: ComponentRendering[];
      }
    | []
> => {
    const getPlaceholderPromise = async (lang: string, path: string, placeholder: string) => {
        const layoutPath = getLayoutPath(path);
        const paths = buildSitecorePath(layoutPath, {});

        let resultData: any;

        for (const pathItem of paths) {
            let result: any;

            try {
                result = await AxiosRequest.get(
                    sitecoreUrls.layoutPlaceholder(pathItem, lang, placeholder),
                    axiosConfig,
                );
            } catch (e) {
                continue;
            }

            if (result) {
                resultData = result.data;
                break;
            }
        }

        return resultData as { elements: ComponentRendering[]; path: string };
    };

    const promises = (Array.isArray(placeholders) ? placeholders : [placeholders]).map(p =>
        getPlaceholderPromise(lang, path, p),
    );

    try {
        const result = await Promise.allSettled(promises);
        const data: { [key: string]: ComponentRendering[] } = {};

        result.forEach(res => {
            if (res.status === 'fulfilled' && res.value?.path) {
                data[res.value.path] = res.value.elements ?? [];
            }
        });

        return data;
    } catch (e) {
        return [];
    }
};

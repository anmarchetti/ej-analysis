import { Agent } from 'http';

import { debug } from '@sitecore-jss/sitecore-jss';
import { AxiosDataFetcher, AxiosDataFetcherConfig } from '@sitecore-jss/sitecore-jss-nextjs';
import { editingDataService, EditingRenderMiddleware } from '@sitecore-jss/sitecore-jss-nextjs/editing';
import { NextApiRequest, NextApiResponse } from 'next';

import { buildBasePathByLang } from 'code/basePath';
import { getEnv } from 'code/env.server';
import { SiteName } from 'models/enum/SiteName';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '100mb',
        },
        responseLimit: false,
    },
};

const axiosConfig: AxiosDataFetcherConfig = {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    debugger: debug.editing,
    httpAgent: new Agent({ keepAlive: true }),
};

function getBasePathByEEReq(req: NextApiRequest) {
    try {
        const payload = req.body;
        const viewBag = JSON.parse(payload.args[2]);
        const lang = viewBag.language ?? 'en';
        const siteName = req.body.id ?? '';

        return getBasePathBySiteName(siteName, lang);
    } catch (e) {
        return '';
    }
}

function getBasePathBySiteName(siteName: string, lang: string) {
    const isTrade = siteName === SiteName.TradePortal;

    return buildBasePathByLang(lang, isTrade);
}

/**
 * Fix relative asset URLs to absolute URLs for Experience Editor.
 * Comprehensive pattern matching for all URL formats.
 */
function fixAssetUrls(html: string, publicUrl: string, assetPrefix: string): string {
    if (!publicUrl || !html) {
        return html;
    }

    const cleanPublicUrl = publicUrl.replace(/\/$/, '');
    const escapedPrefix = assetPrefix.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

    let result = html;

    // Pattern 1: href="/holidays/_next/..." or src="/holidays/_next/..."
    if (assetPrefix) {
        const patternWithPrefix = new RegExp(String.raw`(href|src)(\s*=\s*)(['"])(${escapedPrefix}/_next/)`, 'gi');
        result = result.replaceAll(patternWithPrefix, `$1$2$3${cleanPublicUrl}$4`);
    }

    // Pattern 2: href="/_next/..." (without prefix, but not already absolute)
    const patternWithoutPrefix = new RegExp(
        String.raw`(href|src)(\s*=\s*)(['"])(?!https?://)(?!${escapedPrefix ? escapedPrefix + '/' : ''})(/_next/)`,
        'gi',
    );
    result = result.replaceAll(patternWithoutPrefix, `$1$2$3${cleanPublicUrl}${assetPrefix}$4`);

    // Pattern 3: JSON escaped URLs in inline scripts
    if (assetPrefix) {
        const jsonPattern = new RegExp(String.raw`(\\"|'|")(${escapedPrefix}/_next/)`, 'g');
        result = result.replaceAll(jsonPattern, `$1${cleanPublicUrl}$2`);
    }

    // Pattern 4: CSS url() references
    if (assetPrefix) {
        const cssUrlPattern = new RegExp(String.raw`(url\(['"]?)(${escapedPrefix}/_next/)`, 'gi');
        result = result.replaceAll(cssUrlPattern, `$1${cleanPublicUrl}$2`);
    }

    return result;
}

/**
 * Wraps the response object to intercept ALL methods that could send HTML content.
 */
function wrapResponse(res: NextApiResponse, publicUrl: string, assetPrefix: string): NextApiResponse {
    const processContent = (content: any): any => {
        if (!publicUrl) return content;

        if (typeof content === 'string') {
            return fixAssetUrls(content, publicUrl, assetPrefix);
        }

        if (content && typeof content === 'object' && content.html) {
            content.html = fixAssetUrls(content.html, publicUrl, assetPrefix);
        }

        return content;
    };

    // Intercept res.json()
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
        return originalJson(processContent(body));
    };

    // Intercept res.send()
    const originalSend = res.send.bind(res);
    res.send = function (body: any) {
        return originalSend(processContent(body));
    };

    // Intercept res.end()
    const originalEnd = res.end.bind(res);
    (res as any).end = function (chunk?: any, encoding?: BufferEncoding | (() => void), callback?: () => void) {
        if (typeof chunk === 'string' && publicUrl) {
            chunk = fixAssetUrls(chunk, publicUrl, assetPrefix);
        } else if (Buffer.isBuffer(chunk) && publicUrl) {
            const str = chunk.toString('utf8');

            if (str.includes('_next/')) {
                chunk = Buffer.from(fixAssetUrls(str, publicUrl, assetPrefix), 'utf8');
            }
        }

        return originalEnd(chunk, encoding as BufferEncoding, callback as () => void);
    };

    // Intercept res.write()
    const originalWrite = res.write.bind(res);
    (res as any).write = function (
        chunk: any,
        encoding?: BufferEncoding | ((error: Error | null | undefined) => void),
        callback?: (error: Error | null | undefined) => void,
    ) {
        if (typeof chunk === 'string' && publicUrl) {
            chunk = fixAssetUrls(chunk, publicUrl, assetPrefix);
        } else if (Buffer.isBuffer(chunk) && publicUrl) {
            const str = chunk.toString('utf8');

            if (str.includes('_next/')) {
                chunk = Buffer.from(fixAssetUrls(str, publicUrl, assetPrefix), 'utf8');
            }
        }

        return originalWrite(chunk, encoding as BufferEncoding, callback);
    };

    return res;
}

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    const basePath = getBasePathByEEReq(req);
    const envAll = getEnv();
    const publicUrl = envAll.PUBLIC_URL || process.env.PUBLIC_URL || '';
    const assetPrefix = process.env.ASSET_PREFIX || '/holidays';

    const wrappedRes = wrapResponse(res, publicUrl, assetPrefix);

    const editingHandler = new EditingRenderMiddleware({
        dataFetcher: new AxiosDataFetcher(axiosConfig),
        editingDataService: editingDataService,
        resolvePageUrl: (serverUrl: string, itemPath: string) => {
            const url = `${serverUrl}${basePath}${itemPath}`;

            return url.replace(/\/+$/, '');
        },
        resolveServerUrl: (req: NextApiRequest) =>
            `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.headers.host}`,
    }).getHandler();

    try {
        await editingHandler(req, wrappedRes);
    } catch (e) {
        console.error('[EE Render] Editing Failed:', e);
    }
}

export default handler;

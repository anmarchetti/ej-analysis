import React, { isValidElement } from 'react';
import { observer } from 'mobx-react';
import Head from 'next/head';

import { getCMSLang } from 'code/cmsLang';
import useStore from 'frontend/hooks/useStore';
import { isEmptyObject } from 'frontend/utils/object.utils';
import { purifyUrl } from 'frontend/utils/url.utils';

import { getHreflangTagByPageUrl, parseManualHreflangTag } from './utils';

const HeadHrefLang = () => {
    const { lang, pageFields, pageUrls, fullUrl, getSitePathInLang } = useStore(stores => ({
        lang: stores.layoutStore.lang,
        pageFields: stores.layoutStore.pageFields,
        pageUrls: stores.layoutStore.pageUrls,
        fullUrl: stores.layoutStore.fullUrl,
        getSitePathInLang: stores.layoutStore.getSitePathInLang,
    }));

    // If tags are configured in Sitecore, use them
    const manualHrefTags = parseManualHreflangTag(pageFields?.ManualHreflangTag?.value);

    if (
        !!manualHrefTags &&
        ((Array.isArray(manualHrefTags) && manualHrefTags.length > 0) || isValidElement(manualHrefTags))
    ) {
        return <Head>{manualHrefTags}</Head>;
    }

    // No need to add hreflang tags if page has only current language version (i.e. no page urls) and tags are not configured in Sitecore
    if (!pageUrls || isEmptyObject(pageUrls)) {
        return null;
    }

    // If tags are not configured in Sitecore, generate them for each language version including current one
    const hreflangTags = getHreflangTagByPageUrl(pageUrls, getSitePathInLang);

    return (
        <Head>
            <link rel='alternate' href={purifyUrl(fullUrl)} hrefLang={getCMSLang(lang)} />
            {hreflangTags.map(({ href, hrefLang }) => (
                <link key={hrefLang} rel='alternate' href={href} hrefLang={hrefLang} />
            ))}
        </Head>
    );
};

export default observer(HeadHrefLang);

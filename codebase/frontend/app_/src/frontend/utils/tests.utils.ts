import * as React from 'react';
import { ReactTestRendererJSON } from 'react-test-renderer';
import { createRenderer } from 'react-test-renderer/shallow';

import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';

/**
 * Mounts component one level deep and retrieves it's snapshot.
 * @param element
 */
export function shallowSnapshot(element: React.ReactElement<any>): ReactTestRendererJSON {
    const renderer = createRenderer();

    return renderer.render(element) as any as ReactTestRendererJSON;
}

export function mockSitecoreField<T>(value: T): ISitecoreField<T> {
    return {
        value: value as T,
    } as ISitecoreField<T>;
}

export function mockSitecoreCompositeField<T>(id: string, fields: T, url?: string): ISitecoreCompositeField<T> {
    return {
        id,
        fields,
        url,
    } as ISitecoreCompositeField<T>;
}

export function mockSitecoreImageField(src: string, alt?: string): ISitecoreImage {
    return {
        src,
        ...(alt && { alt }),
    } as ISitecoreImage;
}

// don't pass anything to reproduce an empty link field
export function mockSitecoreLinkField(href?: string, text?: string, linktype?: SitecoreLinkType): ISitecoreLink {
    return {
        href,
        text,
        linktype,
    } as ISitecoreLink;
}

export function getSitecoreFieldsBunch<T = any>(data: (Record<string, 'string' | 'image' | 'link'> | string)[]): T {
    return data.reduce((acc, item) => {
        const [key, type] = typeof item === 'string' ? [item, 'string'] : Object.entries(item)[0];

        switch (type) {
            case 'string':
                return {
                    ...acc,
                    [key]: mockSitecoreField(key),
                };
            case 'image':
                return {
                    ...acc,
                    [key]: mockSitecoreField(mockSitecoreImageField(key)),
                };
            case 'link':
                return {
                    ...acc,
                    [key]: mockSitecoreField(mockSitecoreLinkField(key, key, SitecoreLinkType.Internal)),
                };

            default:
                return acc;
        }
    }, {} as T);
}

/**
 * Snippet that waits until pending Promises are resolved
 */
export const runAllPromises = (): Promise<void> => new Promise(process.nextTick);

import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RichTextWithLinks, { IRichTextWithLinksProps } from './RichTextWithLinks';

export interface IRichTextDictionary extends Partial<IRichTextWithLinksProps> {
    content?: Nullable<string>;
    dictionaryKey?: SitecoreDictionary | string;
}

const RichTextDictionary: FC<IRichTextDictionary> = ({ dictionaryKey, tag, content, ...props }) => {
    const { getPhrase } = useStore(stores => ({ getPhrase: stores.layoutStore.getPhrase }));

    const value = (dictionaryKey && getPhrase(dictionaryKey)) || content || '';

    return <RichTextWithLinks {...props} tag={tag || 'span'} field={{ value }} />;
};

export default RichTextDictionary;

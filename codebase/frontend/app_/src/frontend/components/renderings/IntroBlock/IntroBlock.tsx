import React from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import TextBlock, { ITextBlockParameters } from 'frontend/components/renderings/TextBlock';

export interface IIntroBlockFields {
    IntroDescription: ISitecoreField<string>;
    IntroTitle: ISitecoreField<string>;
}

type TIntroBlockProps = ISitecoreComponent<IIntroBlockFields, ITextBlockParameters>;

export const IntroBlock = ({ fields, params, rendering }: TIntroBlockProps) => {
    if (!fields) {
        return null;
    }

    return (
        <TextBlock
            fields={{ Title: fields.IntroTitle, Description: fields.IntroDescription }}
            params={params}
            rendering={rendering}
        />
    );
};

export default IntroBlock;

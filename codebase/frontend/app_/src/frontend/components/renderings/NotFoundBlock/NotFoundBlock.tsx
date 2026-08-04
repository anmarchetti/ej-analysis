import * as React from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import NotFoundFlipText from './components/NotFoundFlipText';

interface INotFoundBlockFields {
    PageNotFoundMessage: ISitecoreField<string>;
}

export type TNotFoundBlockProps = ISitecoreComponent<INotFoundBlockFields>;

export const NotFoundBlock = ({ fields }: TNotFoundBlockProps) => {
    const text = fields?.PageNotFoundMessage?.value;

    return !!text ? (
        <div className='not-found' data-tid='not-found'>
            <NotFoundFlipText text={text} />
        </div>
    ) : null;
};

export default NotFoundBlock;

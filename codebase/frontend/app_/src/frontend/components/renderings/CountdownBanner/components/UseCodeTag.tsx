import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

interface IUseCodeTag {
    classNames?: string;
    useCode?: ISitecoreField<string>;
    useCodeLabel?: ISitecoreField<string>;
}

export const UseCodeTag = (props: IUseCodeTag) => {
    if (!props.useCode?.value || !props.useCodeLabel?.value) {
        return null;
    }

    return (
        <div className={props.classNames}>
            <Text className='countdown-banner__subtitle-use-code' field={props.useCodeLabel} tag='span' />
            <Text className='countdown-banner__subtitle-code' field={props.useCode} tag='span' />
        </div>
    );
};

export default UseCodeTag;

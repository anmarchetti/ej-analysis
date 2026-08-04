import * as React from 'react';
import classNames from 'classnames';

import { isIE } from 'frontend/utils/browser.utils';
import isBackend from 'frontend/utils/isBackend';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { withRerender } from 'frontend/components/hoc';
import HtmlBlock from 'frontend/components/renderings/HtmlBlock';

interface IIECompatibilityBannerFields {
    Html: ISitecoreField<string>;
}

type TIECompatibilityBannerProps = ISitecoreComponent<IIECompatibilityBannerFields>;

export const IECompatibilityBanner = (props: TIECompatibilityBannerProps) => {
    if (!props.fields) {
        return null;
    }

    return (
        <HtmlBlock
            className={classNames({
                'd-none': isBackend() || !isIE(),
            })}
            fields={props.fields}
            params={{ Destinations: '', Locations: '', Query: '' }}
            rendering
        />
    );
};

export default withRerender(IECompatibilityBanner);

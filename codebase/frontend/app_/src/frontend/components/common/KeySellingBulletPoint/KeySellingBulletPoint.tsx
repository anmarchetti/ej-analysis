import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

interface IKeySellingPoint {
    ksp: Nullable<string | ISitecoreField<string>>;
}

const KeySellingBulletPoint: FC<IKeySellingPoint> = ({ ksp }) => {
    if (ksp) {
        if (typeof ksp === 'string') {
            return <li data-tid='key-selling-point-1-bullet-item'>{ksp}</li>;
        } else if (ksp.value) {
            return (
                <li data-tid='key-selling-point-1-bullet-item'>
                    <Text field={ksp} />
                </li>
            );
        }
    }

    return null;
};

export default KeySellingBulletPoint;

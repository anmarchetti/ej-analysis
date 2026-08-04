import * as React from 'react';
import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { IHealthEntryRequirement } from 'models/data/IBookingInfo';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import HealthEntryRequirementTile from './components/HealthEntryRequirementTile';

interface IHealthEntryRequirementsFields {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface IHealthEntryRequirementsProps extends ISitecoreComponent<IHealthEntryRequirementsFields> {
    children?: any;
    id?: string;
    requirements?: IHealthEntryRequirement[];
}

const HealthEntryRequirements: FC<IHealthEntryRequirementsProps> = props => {
    const { fields, requirements, children } = props;
    const { Title, Description } = fields || {};

    if (!requirements?.length && !children) {
        return null;
    }

    return (
        <div id={props.id} className='health-entry-requirements no-print' data-tid='health-entry-requirements'>
            {!!Title?.value && <Text field={Title} tag='h2' className='health-entry-requirements__title' />}
            {!!Description?.value && (
                <RichTextWithLinks field={Description} tag='div' className='health-entry-requirements__description' />
            )}
            <div className='health-entry-requirements__list' data-tid='health-entry-requirements-list'>
                {children}
                {!!requirements?.length &&
                    requirements.map((item, i) => <HealthEntryRequirementTile key={i} item={item} />)}
            </div>
        </div>
    );
};

export default HealthEntryRequirements;

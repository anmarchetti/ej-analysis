import React, { FC } from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

interface IPersonalizeWebExperimentPlaceholderParams {
    Delay: string;
    Height: string;
    PlaceholderName: string;
}

export type TPersonalizeWebExperimentPlaceholderProps = ISitecoreComponent<
    object,
    IPersonalizeWebExperimentPlaceholderParams
>;

export const PersonalizeWebExperimentPlaceholder: FC<TPersonalizeWebExperimentPlaceholderProps> = ({ params }) => {
    if (!params.PlaceholderName) return null;

    return (
        <div data-tid='personalize-web-experiment-placeholder'>
            <div data-tid={params.PlaceholderName} />
        </div>
    );
};

export default PersonalizeWebExperimentPlaceholder;

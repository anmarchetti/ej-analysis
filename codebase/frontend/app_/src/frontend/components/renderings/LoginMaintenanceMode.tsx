import * as React from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { JSSImage } from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

interface ILoginMaintenanceModeFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    Title: ISitecoreField<string>;
}

type TLoginMaintenanceModeProps = ISitecoreComponent<ILoginMaintenanceModeFields>;

const LoginMaintenanceMode = (props: TLoginMaintenanceModeProps) => {
    const { fields } = props;

    if (!fields) {
        return null;
    }

    return (
        <>
            <div className='wrapper--solid wrapper--solid--grey'>
                <div className='wrapper-container wrapper-container--px'>
                    <div className='login-maintenance-mode'>
                        {!!fields.Icon && <JSSImage field={fields.Icon} />}
                        {!!fields.Title && (
                            <RichTextWithLinks
                                field={fields.Title}
                                tag='h2'
                                className='login-maintenance-mode__title'
                            />
                        )}
                        {!!fields.Description && (
                            <RichTextWithLinks
                                field={fields.Description}
                                tag='div'
                                className='login-maintenance-mode__description'
                            />
                        )}
                        {!!fields.Link?.value?.text && (
                            <RouterLink link={fields.Link} className='btn'>
                                {fields.Link.value.text}
                            </RouterLink>
                        )}
                    </div>
                </div>
            </div>
            <div className='wrapper--solid wrapper-triangle--g2t-alt' />
        </>
    );
};

export default LoginMaintenanceMode;

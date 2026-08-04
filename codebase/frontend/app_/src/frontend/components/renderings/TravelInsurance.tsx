import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

interface ITravelInsuranceFields {
    Description: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    Text: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface IAutoProtectionProps extends ISitecoreComponent<ITravelInsuranceFields> {
    id?: string;
    isBookingCanceled?: boolean;
    isTitleOutside?: boolean;
}

const TravelInsurance: React.FC<IAutoProtectionProps> = props => {
    if (!props.fields?.Link?.value.url) {
        return null;
    }

    const { Link, Title, Image, Description } = props.fields;

    const renderTitle = (): React.JSX.Element | null => {
        if (!Title?.value) return null;

        return <Text field={Title} tag='h2' className='booking-insurance__title' data-tid='booking-insurance-title' />;
    };

    return (
        <div className='booking-insurance' data-tid='booking-insurance' id={props.id}>
            {props.isTitleOutside && renderTitle()}

            <div className='rounded-container'>
                <div className='booking-insurance__header'>
                    {!props.isTitleOutside && renderTitle()}
                    <JSSImage field={Image} className='booking-insurance__image' />
                </div>
                <Text field={Description} tag='p' className='booking-insurance__subtitle' />
                <RichTextWithLinks field={props.fields.Text} />
                {Link?.value && !props.isBookingCanceled && (
                    <RouterLink link={Link} className='btn btn--medium booking-insurance__button'>
                        {Link.value.text}
                    </RouterLink>
                )}
            </div>
        </div>
    );
};

export default TravelInsurance;

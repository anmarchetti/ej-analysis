import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

export interface IAncillariesPersonDetailsProps {
    personIcon: Nullable<ISitecoreField<ISitecoreImage>>;
    title: Nullable<string>;
    titleConstant: Nullable<string>;
    age?: Nullable<string>;
}

const AncillariesPersonDetails = ({ personIcon, titleConstant, title, age }: IAncillariesPersonDetailsProps) => {
    const { isExtrasPage } = useStore(stores => ({
        isExtrasPage: stores.layoutStore.isExtrasPage,
    }));

    return (
        <>
            <span className='seat-confirmation__people-icon'>
                <JSSImage field={personIcon} />
            </span>
            <span className='seat-confirmation__people-number' data-cs-mask>
                {isExtrasPage ? titleConstant : title}
            </span>
            {age && (
                <span className='seat-confirmation__people-number seat-confirmation__people-age' data-tid='age'>
                    {age}
                </span>
            )}
        </>
    );
};

export default observer(AncillariesPersonDetails);

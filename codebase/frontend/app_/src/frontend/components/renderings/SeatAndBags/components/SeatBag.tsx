import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

interface ISeatBagProps {
    text: Nullable<string>;
    children?: JSX.Element;
    count?: number;
    icon?: ISitecoreField<ISitecoreImage>;
}

const SeatBag = ({ text, icon, count = 0, children }: ISeatBagProps) => (
    <div className='seat-confirmation__bag'>
        {children}
        {!!icon?.value?.src && <JSSImage className='seat-confirmation__bag-icon' field={icon} />}
        {!!text && (
            <div className='seat-confirmation__bag-text' data-cs-mask>
                {count ? `${count} x` : ''} {text}
            </div>
        )}
    </div>
);

export default SeatBag;

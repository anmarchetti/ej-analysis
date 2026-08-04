import { cmsUrls } from 'code/endpoints';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IFacilityItemProps {
    description: string;
    title: string;
    iconUrl?: string;
}

const FacilityItemFood = ({ title, description, iconUrl }: IFacilityItemProps) => (
    <div className='flex-list-box' data-tid='facility-group-food-drink'>
        <h3 className='flex-list-head'>
            {iconUrl && <img className='me-2' src={cmsUrls.media(iconUrl)} width={18} height={18} alt={title} />}
            <span>{title}</span>
        </h3>
        <RichTextWithLinks className='facilities-tabs__panel-description' field={{ value: description }} />
    </div>
);

export default FacilityItemFood;

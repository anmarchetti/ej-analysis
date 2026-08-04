import { IHotelType } from 'models/data/IHotel';
import JSSImage from 'frontend/components/common/JSSImage';

interface IHolidayTypeBannerProps {
    type: IHotelType;
}

const HolidayTypeBanner: React.FC<IHolidayTypeBannerProps> = props => (
    <section className='holiday-type-banner m-0 p-3' aria-label='Holiday Type Banner'>
        <div className='row d-flex flex-nowrap'>
            <div className='type-icon px-2 ps-sm-3 text-center'>
                {props.type.filledIcon && (
                    <JSSImage
                        field={{
                            value: {
                                src: props.type.filledIcon,
                            },
                        }}
                    />
                )}
            </div>
            <div className='type-desc px-2 pe-sm-3 pt-sm-1 d-flex flex-column justify-content-center align-content-center'>
                {props.type.typeAndThemeTitle && (
                    <span className='type-title mb-1'>{props.type.typeAndThemeTitle}</span>
                )}
                <p>{props.type.description}</p>
            </div>
        </div>
    </section>
);

export default HolidayTypeBanner;

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { ICustomerFeedback } from 'models/data/ICustomerFeedback';
import StarRating from 'frontend/components/common/StarRating';

import style from './CustomerFeedbackCard.module.scss';

export interface ICustomerFeedbackCard {
    item: ICustomerFeedback;
    dataId?: string;
    showTitleAndComment?: boolean;
}

const CustomerFeedbackCard = ({ item, showTitleAndComment, dataId }: ICustomerFeedbackCard) => (
    <div className={style['feedback-card']} data-tid={dataId}>
        <div className={style['feedback-card__rating']} data-tid='feedback-card-rating'>
            <StarRating rating={Math.floor(item.rating)} />
        </div>
        {showTitleAndComment && item.title && (
            <div className={style['feedback-card__title']} data-tid='feedback-card-title'>
                {item.title}
            </div>
        )}
        {showTitleAndComment && item.text && (
            <div className={style['feedback-card__text']} data-tid='feedback-card-text'>
                {item.text}
            </div>
        )}
        <div className={style['feedback-card__date']} data-tid='feedback-card-date'>
            {item.customerName} - {formatDateL10n(item.date, DATE_FORMATS.fullDate)}
        </div>
    </div>
);

export default CustomerFeedbackCard;

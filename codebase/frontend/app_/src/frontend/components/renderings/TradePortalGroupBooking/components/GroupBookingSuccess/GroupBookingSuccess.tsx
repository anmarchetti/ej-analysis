import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import Button from 'frontend/components/common/Button';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { ITradePortalGroupBookingFields } from 'frontend/components/renderings/TradePortalGroupBooking/TradePortalGroupBooking';

import style from './GroupBookingSuccess.module.scss';

interface IGroupBookingSuccessProps {
    fields: ITradePortalGroupBookingFields;
}

const GroupBookingSuccess = ({ fields }: IGroupBookingSuccessProps) => {
    const { SuccessTitle, SuccessDescription, BackToHomeCTAText } = fields || {};
    const { redirectToHomePage } = useStore((stores: ITradePortalStores) => ({
        redirectToHomePage: stores.routerStore.redirectToHomePage,
    }));

    return (
        <section className={style['success-section']} data-tid='group-booking-success'>
            <div className='wrapper-component-container wrapper-component-container--grey'>
                <div className='wrapper-component-container__inner'>
                    <div className={classNames('text-block mt-3', style['title'])}>
                        <Text
                            field={SuccessTitle}
                            className='text-block__header text-block__header--rounded'
                            tag='h1'
                            data-tid='group-booking-success-title'
                        />
                    </div>
                </div>
            </div>
            <div className='wrapper-component-container'>
                <div className='wrapper-component-container__inner pt-5 pb-5'>
                    <RichTextWithLinks
                        field={SuccessDescription}
                        className={style['description']}
                        dataId='group-booking-success-description'
                    />
                    <Button isMedium onClick={redirectToHomePage} data-tid='group-booking-success-btn'>
                        <Text field={BackToHomeCTAText} tag='span' />
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default GroupBookingSuccess;

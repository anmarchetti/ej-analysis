import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './CancellationBreakdown.module.scss';

export enum BreakdownItemId {
    Date = 'date',
    Email = 'email',
    CreditRefund = 'credit-refund',
    OriginalRefund = 'original-refund',
    TradeBookingEmail = 'trade-booking-email',
    TradeBookingDate = 'trade-booking-date',
}
export interface ICancellationBreakdownItemFields {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    UniqueId: ISitecoreField<string>;
}

export interface ICancellationBreakdownFields {
    BottomText: ISitecoreField<string>;
    Children: ISitecoreChildren<ICancellationBreakdownItemFields>[];
    Subtext: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    TradeBookingsBottomText: ISitecoreField<string>;
    TradeBookingsSubtext: ISitecoreField<string>;
}

export type TCancellationBreakdownProps = ISitecoreComponent<ICancellationBreakdownFields>;

const CancellationBreakdown: FC<TCancellationBreakdownProps> = ({ fields }) => {
    const { booking, formatMoney } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
        formatMoney: stores.marketStore.formatMoney,
    }));

    if (!fields || !booking?.cancelledBookingSummary) {
        return null;
    }

    const { Title, Subtext, BottomText, Children } = fields;

    const {
        package: { accom },
        cancellationDate,
        leadPassenger,
        cancelledBookingSummary: { cashRefundAmount, creditRefundAmount, currency },
        isLoggedInAsLeadPassenger,
    } = booking;

    const subText = booking.isExternalAgency ? fields.TradeBookingsSubtext.value : Subtext.value;
    const bottomText = booking.isExternalAgency ? fields.TradeBookingsBottomText : BottomText;
    const tokenizedSubtext = Tokenizer.replaceTokens(subText, {
        [Tokens.Date]: formatDateL10n(accom.startDate, DATE_FORMATS.L),
    });

    const cancellationBreakdownItems = Children.filter(item => {
        if (item.fields.UniqueId.value === BreakdownItemId.Date && !booking.isExternalAgency) {
            return true;
        }

        if (item.fields.UniqueId.value === BreakdownItemId.TradeBookingDate && booking.isExternalAgency) {
            return true;
        }

        if (
            isLoggedInAsLeadPassenger &&
            !!cashRefundAmount &&
            !booking.isExternalAgency &&
            item.fields.UniqueId.value === BreakdownItemId.OriginalRefund
        ) {
            return true;
        }

        if (
            isLoggedInAsLeadPassenger &&
            !!creditRefundAmount &&
            !booking.isExternalAgency &&
            item.fields.UniqueId.value === BreakdownItemId.CreditRefund
        ) {
            return true;
        }

        if (
            isLoggedInAsLeadPassenger &&
            !booking.isExternalAgency &&
            item.fields.UniqueId.value === BreakdownItemId.Email
        ) {
            return true;
        }

        if (booking.isExternalAgency && item.fields.UniqueId.value === BreakdownItemId.TradeBookingEmail) {
            return true;
        }

        return false;
    });

    return (
        <div className={styles.container} data-tid='cancellation-breakdown'>
            <div>
                <Text field={Title} className={styles.header} tag='h2' data-tid='cancellation-breakdown-title' />
                <RichTextWithLinks
                    field={{ value: tokenizedSubtext }}
                    className={styles.subtext}
                    dataId='cancellation-breakdown-description'
                />
            </div>
            <div className={styles.content}>
                {cancellationBreakdownItems.map((item, index) => {
                    const { Title, UniqueId, Description } = item.fields;

                    const tokenizedDescription = Tokenizer.replaceTokens(Description.value, {
                        [Tokens.Email]: leadPassenger?.email || '',
                        [Tokens.Date]: formatDateL10n(cancellationDate, DATE_FORMATS.L),
                        [Tokens.Price]: formatMoney(creditRefundAmount, {
                            currency: currency,
                        }),
                    });

                    return (
                        <div
                            data-tid={`cancellation-breakdown-item-${UniqueId.value}`}
                            className={classNames(styles.item)}
                            key={UniqueId.value}
                        >
                            <SvgTick className={styles.icon} />
                            <div className={styles.itemContentContainer}>
                                <Text
                                    field={Title}
                                    className={styles.itemTitle}
                                    tag='h4'
                                    data-tid='cancellation-breakdown-item-title'
                                />
                                <RichTextWithLinks
                                    className={styles.itemContent}
                                    field={{ value: tokenizedDescription }}
                                    dataId='cancellation-breakdown-item-description'
                                />
                            </div>
                            {index !== cancellationBreakdownItems.length - 1 && (
                                <div data-tid='cancellation-breakdown-item-separator' className={styles.separator} />
                            )}
                        </div>
                    );
                })}
            </div>
            <RichTextWithLinks
                field={bottomText}
                className={styles.bottomText}
                dataId='cancellation-breakdown-bottom-text'
            />
        </div>
    );
};

export default CancellationBreakdown;

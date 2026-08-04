import { FunctionComponent } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { RichTextWithLinks } from 'frontend/components/common/RichTextWithLinks';

import useCountdown from './CountdownTimer.utils';

import styles from './CountdownTimer.module.scss';

export interface ICountdownTimerProps {
    date: ISitecoreField<string>;
    field: ISitecoreField<string>;
    className?: string;
}

const CountdownTimer: FunctionComponent<ICountdownTimerProps> = ({ className, date, field }): null | JSX.Element => {
    const data = useCountdown(date.value);

    if (!data) return null;

    return (
        <RichTextWithLinks
            className={classNames(className, styles.noWrapContainer)}
            field={{
                value: Tokenizer.replaceTokens(field.value, {
                    [Tokens.Days]: `<span class='${styles.countdownTimerItem}'>${data?.days}</span>`,
                    [Tokens.Hours]: `<span class='${styles.countdownTimerItem}'>${data?.hours}</span>`,
                    [Tokens.Minutes]: `<span class='${styles.countdownTimerItem}'>${data?.minutes}</span>`,
                    [Tokens.Seconds]: `<span class='${styles.countdownTimerItem}'>${data?.seconds}</span>`,
                }),
            }}
        />
    );
};

export default CountdownTimer;

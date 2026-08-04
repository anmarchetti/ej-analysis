import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { ICustomisableComponentParams } from 'models/data/ICustomisableComponentParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Checkbox from 'frontend/components/common/Checkbox';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './SubscribeBlock.module.scss';

interface ISubscribeBlockFields {
    Description?: ISitecoreField<string>;
    SignUpLink?: ISitecoreField<ISitecoreLink>;
    SignUpLinkCheckboxText?: ISitecoreField<string>;
    SignUpLinkPlaceholder?: ISitecoreField<string>;
    Title?: ISitecoreField<string>;
}

export type TSubscribeBlockProps = ISitecoreComponent<ISubscribeBlockFields, ICustomisableComponentParams>;

export const SubscribeBlock: FC<TSubscribeBlockProps> = ({ fields, params }) => {
    const { trackHomepageAction, sitePath } = useStore((stores: TStores) => ({
        trackHomepageAction: stores.trackingStore.trackHomepageAction,
        sitePath: stores.layoutStore.sitePath,
    }));

    if (!fields) {
        return null;
    }

    const handleBtnClick = (): void => {
        trackHomepageAction(EventTypes.StayInTheLoop, {
            location: fields.Title?.value || 'Stay in the loop',
            name: fields.SignUpLink?.value.text || 'Sign up',
            destination: buildSitecoreLinkFullUrl(fields.SignUpLink, sitePath),
        });
    };

    const titleClassName = getCustomisableTitleClassName('subscribe-section__title', params);

    const className = classNames('subscribe-section', getPaddingSizeClassName(params?.PaddingSize));

    return (
        <div className={className}>
            <div className='row'>
                <div className='col-12 col-md-9'>
                    {fields.Title?.value && <Text tag='div' className={titleClassName} field={fields.Title} />}
                    {fields.Description?.value && (
                        <Text tag='div' className='subscribe-section__description' field={fields.Description} />
                    )}
                </div>
                <div className='col-12 col-md-auto'>
                    <div className={styles.signUpForm}>
                        <div className={styles.inputBlock}>
                            {/* { TODO: Sending emails is not implemented. Decided to hide for launch
                                props.fields.SignUpLinkPlaceholder &&
                                props.fields.SignUpLinkPlaceholder.value &&
                                <>
                                    <input
                                        type="text"
                                        placeholder={props.fields.SignUpLinkPlaceholder.value}
                                    />
                                    <i className={styles.iconBlock}>
                                        <SvgEmailFilled />
                                    </i>
                                </>
                            } */}
                            {fields.SignUpLink?.value && (
                                <RouterLink
                                    link={fields.SignUpLink}
                                    className={classNames('btn btn--md btn--outlined', styles.buttonLink)}
                                    onClick={handleBtnClick}
                                >
                                    {fields.SignUpLink.value.text}
                                </RouterLink>
                            )}
                        </div>
                        {fields.SignUpLinkCheckboxText?.value && (
                            <Checkbox
                                small
                                tick
                                textRight
                                checked={false}
                                label={fields.SignUpLinkCheckboxText.value}
                                onChange={() => {}}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscribeBlock;

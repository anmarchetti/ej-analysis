import React, { FunctionComponent, useMemo, useRef } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
    getTextBlockTextPositionClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import isBackend from 'frontend/utils/isBackend';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { ICustomisableComponentParamsWithTitleTag } from 'models/data/ICustomisableComponentParams';
import { MediaSize } from 'models/data/MediaSizeParams';
import { TextPosition } from 'models/enum/CustomisableComponentsParameters';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import ReadMoreTextBlock from 'frontend/components/common/ReadMoreTextBlock';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import SeoReadMoreTextBlock from 'frontend/components/common/SeoReadMoreTextBlock';

export interface ITextBlockParameters extends ICustomisableComponentParamsWithTitleTag {
    ClassName?: string;
    DescriptionPosition?: TextPosition;
    EnableSeoReadMoreText?: TSitecoreCheckboxValue;
    IsIconAboveTitle?: TSitecoreCheckboxValue;
    TruncateTextOnMobile?: TSitecoreCheckboxValue;
}

export interface ITextBlockFields {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
    Link?: ISitecoreField<ISitecoreLink>;
}

interface ITextBlockProps extends ISitecoreComponent<ITextBlockFields, ITextBlockParameters> {
    customDescription?: string;
    height?: number;
}

const TRUNCATE_OPTIONS = {
    length: 200,
    decodeEntities: true,
    reserveLastWord: true,
};

const IMAGE_SIZE = 40;
export const DEFAULT_OVERALL_HEIGHT = 120;

export const TextBlock: FunctionComponent<ITextBlockProps> = ({
    fields,
    params,
    rendering,
    height,
    customDescription,
}) => {
    const { isEditMode } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));
    const titleRef = useRef<HTMLDivElement>(null);

    // Use upper case letter to avoid TypeScript error about 'JSX.IntrinsicElements'
    const TitleTag = (params?.TitleTag || 'div') as React.ElementType;

    const titleClassName = classNames(
        getCustomisableTitleClassName('text-block__header', params, true),
        isSitecoreCheckboxSelected(params?.IsIconAboveTitle) && 'text-block__header--icon-above',
    );

    const descriptionClassName = classNames(
        'text-block__description',
        getTextBlockTextPositionClassName(params?.DescriptionPosition, false),
    );

    const buttonWrapperClassName = classNames(
        'd-flex align-items-center flex-wrap',
        getTextBlockTextPositionClassName(params?.DescriptionPosition),
    );

    const className = classNames('text-block', params?.ClassName ?? '', getPaddingSizeClassName(params?.PaddingSize));

    const overallHeight = useMemo(() => {
        if (!height) {
            return DEFAULT_OVERALL_HEIGHT;
        }

        if (!titleRef?.current) {
            return height;
        }

        const titleHeight = titleRef.current.scrollHeight ?? 0;
        const titleStyle = window.getComputedStyle(titleRef?.current);
        const titleHeightWithMargins = titleHeight + parseInt(titleStyle.marginTop) + parseInt(titleStyle.marginBottom);

        return height - titleHeightWithMargins;
    }, [height, titleRef]);

    const descriptionValue = fields?.Description?.value ?? customDescription ?? '';
    const isTruncated = isSitecoreCheckboxSelected(params?.TruncateTextOnMobile);
    const isSeoTextEnabled = isSitecoreCheckboxSelected(params?.EnableSeoReadMoreText);
    const shouldRenderSeoLogic = isEditMode || isBackend() || !isTruncated;

    const TextComponent = useMemo(() => {
        if (!descriptionValue) return null;

        if (shouldRenderSeoLogic && isSeoTextEnabled) {
            return (
                <SeoReadMoreTextBlock
                    className='promopage-search-pod-description'
                    text={descriptionValue}
                    overallHeightDesktop={overallHeight}
                />
            );
        }

        if (shouldRenderSeoLogic && !isSeoTextEnabled) {
            return (
                <RichTextWithLinks
                    field={{ value: descriptionValue }}
                    className={descriptionClassName}
                    dataId='text-block-description'
                />
            );
        }

        return (
            <ReadMoreTextBlock
                className={descriptionClassName}
                text={descriptionValue}
                truncateOptions={TRUNCATE_OPTIONS}
                isActiveOnlyOnMobile
            />
        );
    }, [descriptionValue, descriptionClassName, overallHeight, shouldRenderSeoLogic, isSeoTextEnabled]);

    if (!fields) {
        return null;
    }

    const { Icon, Title, Link } = fields;

    const iconSizes = {
        desktop: {
            width: Icon?.value?.width ?? IMAGE_SIZE,
            height: Icon?.value?.height ?? IMAGE_SIZE,
        },
        mobile: {
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
        },
    };

    return (
        <div className={className} data-tid='text-block'>
            <TitleTag className={titleClassName} ref={titleRef} data-tid='text-block-title'>
                <JSSImageNext
                    field={Icon}
                    className='text-block__icon'
                    mediaSize={MediaSize.Small}
                    dynamicSize={iconSizes}
                />
                <Text field={Title} />
            </TitleTag>

            {TextComponent}

            {(!!Link?.value?.href || !!rendering?.placeholders?.[PlaceholderNames.ModalDialog]?.length) && (
                <div className={buttonWrapperClassName} data-tid='button-wrapper'>
                    {!!Link?.value?.href && (
                        <div className='me-3 mb-2'>
                            <RouterLink link={Link}>{Link.value.text}</RouterLink>
                        </div>
                    )}
                    {!!rendering?.placeholders?.[PlaceholderNames.ModalDialog]?.length && (
                        <div className='mb-2'>
                            <Placeholder name={PlaceholderNames.ModalDialog} rendering={rendering} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TextBlock;

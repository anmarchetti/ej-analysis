import * as React from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { ITopicFields } from 'models/data/ITopicFields';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSResponsiveImage from 'frontend/components/common/JSSResponsiveImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import PathBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

import ArticleMetaData from './components/ArticleMetaData/ArticleMetaData';

interface IArticleBlockFields {
    PublicationDate: ISitecoreField<string>;
    BottomContent?: ISitecoreField<string>;
    Image?: ISitecoreField<ISitecoreImage>;
    Title?: ISitecoreField<string>;
    TopContent?: ISitecoreField<string>;
    Topics?: ISitecoreCompositeField<ITopicFields>[];
}

export type TArticleBlockProps = ISitecoreComponent<IArticleBlockFields>;

export const ArticleBlock: React.FunctionComponent<TArticleBlockProps> = props => {
    if (!props.fields) {
        return null;
    }

    return (
        <div>
            <div className='press-release-banner' data-tid='article-block-banner'>
                {!!props.fields.Image && (
                    <div data-tid='responsive-cover'>
                        <JSSResponsiveImage field={props.fields.Image} className='press-release-banner__image' />
                    </div>
                )}
                <div className='press-release-banner__inner'>
                    <div className='press-release-banner__placeholder-top'>
                        <PathBreadcrumbs />
                    </div>
                </div>
                <div className='press-release-banner__triangle' />
            </div>
            <div className='wrapper-component-container'>
                <div className='wrapper-shape'>
                    <div className='wrapper-shape__triangle-start' />
                    <div className='wrapper-component-container__inner'>
                        <div className='wrapper--solid'>
                            <div className='wrapper-container'>
                                <div className='press-release-content'>
                                    <h2 className='press-release-content__title'>{props.fields.Title?.value}</h2>
                                    <ArticleMetaData
                                        topics={(props.fields.Topics || []).map(topic => topic.fields?.Name?.value)}
                                        date={props.fields.PublicationDate?.value || ''}
                                        className='press-release-content__additional-data'
                                    />
                                    <div className='press-release-content__text'>
                                        {props.fields.TopContent && (
                                            <RichTextWithLinks
                                                tag='div'
                                                className='info-with-action__text'
                                                field={props.fields.TopContent}
                                            />
                                        )}
                                        <Placeholder name={PlaceholderNames.MediaContent} rendering={props.rendering} />
                                        {props.fields.BottomContent && (
                                            <RichTextWithLinks
                                                tag='div'
                                                className='info-with-action__text'
                                                field={props.fields.BottomContent}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='wrapper-shape__triangle-end' />
                </div>
            </div>
        </div>
    );
};

const ConnectedArticleBlock = inject((stores: TStores) => ({
    fields: stores.layoutStore.pageFields,
}))(ArticleBlock);

export default ConnectedArticleBlock;

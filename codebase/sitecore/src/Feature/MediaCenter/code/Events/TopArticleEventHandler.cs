using System;
using System.Linq;
using easyJet.Feature.MediaCenter.ContentSearch.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.ContentSearch.Utilities;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Events;

namespace easyJet.Feature.MediaCenter.Events
{
    public class TopArticleEventHandler
    {
        private readonly IArticleSearchRepository repository;
        private readonly IDatabaseProvider databaseProvider;

        public TopArticleEventHandler(IArticleSearchRepository repository, IDatabaseProvider databaseProvider)
        {
            this.repository = repository;
            this.databaseProvider = databaseProvider;
        }

        /// <summary>
        /// Uncheck top article if current item is not top article when item saved.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnItemSaved(object sender, EventArgs args)
        {
            if (Event.ExtractParameter(args, 0) is Item item && item.TemplateID.Equals(Constants.TemplateIds.ArticlePage))
            {
                UncheckTopArticles(item);
            }
        }

        /// <summary>
        /// Uncheck top articles if current item is not top article.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        private void UncheckTopArticles(Item item)
        {
            try
            {
                var isTopArticle = MainUtil.GetBool(item[Constants.FieldsIds.ArticlePageItem.IsTopArticle], false);
                if (isTopArticle)
                {
                    var topArticles = repository.GetTopArticles(item.Database).Where(x => !x.Document.ItemId.Equals(item.ID));

                    var items = topArticles.Select(x => databaseProvider.GetItem(x.Document.Uri));
                    items
                      .ForEach(x =>
                      {
                          x.Editing.BeginEdit();
                          // "0" value if checkbox unchecked.
                          x[Constants.Fields.ArticlePageItem.IsTopArticle] = "0";
                          x.Editing.EndEdit();
                      });
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex.Message, ex, this);
            }
        }
    }
}
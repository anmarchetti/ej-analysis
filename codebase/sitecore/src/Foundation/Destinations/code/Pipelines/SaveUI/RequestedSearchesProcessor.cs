using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

[assembly: InternalsVisibleTo("easyJet.Foundation.Destinations.Tests")]

namespace easyJet.Foundation.Destinations.Pipelines.SaveUI
{
    public class RequestedSearchesProcessor
    {
        private readonly IDatabaseProvider databaseProvider;

        public RequestedSearchesProcessor(IDatabaseProvider databaseProvider)
        {
            this.databaseProvider = databaseProvider;
        }

        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which check that request search inheritance from promo page.
        /// </summary>
        /// <param name="args">SaveArgs arguments.</param>
        public void Process(SaveArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            Assert.IsNotNull(args.Items, nameof(args.Items));

            var saveItem = args.Items.FirstOrDefault();
            if (saveItem != null)
            {
                var database = databaseProvider.GetDatabase(DatabaseType.Content);
                var item = database.GetItem(saveItem.ID, saveItem.Language);

                if (item != null && item.TemplateID.Equals(Constants.TemplateIds.RequestedSearch))
                {
                    var promoPageField = saveItem.Fields.First(x => x.ID.Equals(Constants.FieldsIds.RequestedSearch.PromoPageId));
                    // Check that count of selected promo pages more than 1.
                    var selectedPromoPages = promoPageField.Value.Split('|');
                    if (selectedPromoPages.Length > 1 && args.HasSheerUI)
                    {
                        Alert("Promo page field allows only one item");
                        args.AbortPipeline();
                    }
                    else
                    {
                        var promoPage = database.GetItem(promoPageField.Value, saveItem.Language);
                        if (promoPage != null && string.IsNullOrWhiteSpace(item[Constants.Fields.RequestedSearch.PromoPage]) && args.HasSheerUI)
                        {
                            Alert($"The {item.Name} item inherited from the {promoPage.Name} promo page also Time period fields will be inherited from the deals and the search parameters of the requested search item will be ignored.");
                        }
                    }
                }
            }
        }

        internal virtual void Alert(string message)
        {
            SheerResponse.Alert(message);
        }
    }
}
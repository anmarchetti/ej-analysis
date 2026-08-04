using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Presentation.Extensions;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Mvc.Pipelines.Response.GetXmlBasedLayoutDefinition;
using Sitecore.Mvc.Presentation;
using Sitecore.Web;
using static easyJet.Foundation.Presentation.Templates;

namespace easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition
{
    /// <summary>
    /// GetXmlBasedLayoutDefinition Pipeline which arrange hotels details renderings in order of a template configuration.
    /// </summary>
    public class ArrangeHotelsDetailsRenderings : SiteSpecificProcessor
    {
        private readonly IHtmlCacheRepository cache;
        private readonly ILayoutXmlService service;
        private readonly IPresentationLogger logger;
        private readonly IDatabaseProvider databaseProvider;

        public ArrangeHotelsDetailsRenderings(IHtmlCacheRepository cache, ILayoutXmlService service, IPresentationLogger logger, IDatabaseProvider databaseProvider)
        {
            this.service = service;
            this.logger = logger;
            this.databaseProvider = databaseProvider;
            this.cache = cache;
        }

        /// <summary>
        /// Arrange hotels details renderings in order of a template configuration.
        /// </summary>
        /// <param name="args">Argument of context item's XML layout definition.</param>
        public override void HandleRequest(GetXmlBasedLayoutDefinitionArgs args)
        {
            var contextItem = args.ContextItem ?? PageContext.Current.Item;

            if (!contextItem.HasBaseTemplate(new TemplateID(Templates.HotelDetailsPage.Id)) &&
                !contextItem.HasBaseTemplate(new TemplateID(Templates.TradePortalHotelDetailsPage.Id)))
            {
                return;
            }

            var accId = WebUtil.GetQueryString(Constants.QueryStringParams.AccommadationId)?.ToUpper();
            var theme = WebUtil.GetQueryString(Constants.QueryStringParams.Theme)?.ToUpper();

            if (string.IsNullOrEmpty(theme) && string.IsNullOrEmpty(accId))
            {
                return;
            }

            var pageDesigns = GetPageDesigns(contextItem);
            if (pageDesigns == null || !pageDesigns.Any())
            {
                return;
            }

            // If Page design exist for passed accommodation overwrite global theme design, otherwise get theme page design - WP-283 apply design if it has a version in the current language
            if ((pageDesigns.TryGetValue(accId, out Item pageDesign) || pageDesigns.TryGetValue(theme, out pageDesign)) && pageDesign != null && pageDesign.Versions.Count > 0)
            {
                service.ArrangeRenderings(args.Result, pageDesign);
            }
        }

        /// <summary>
        /// Get Page Designs under presentation folder.
        /// </summary>
        /// <param name="contextItem">Sitecore context Item.</param>
        /// <returns>Dictionary of Page Designs
        /// where 'key' is a type of the page design like 'beach' or 'city'
        /// and 'value' is Page Design Item.</returns>
        private Dictionary<string, Item> GetPageDesigns(Item contextItem)
        {
            var cacheKey = $"easyJet.Foundation.Presentation.HotelDesigns-{Sitecore.Context.Site.Name}";
            var hotelDesigns = cache.GetItem<Dictionary<string, Item>>(cacheKey);
            if (hotelDesigns != null)
            {
                return hotelDesigns;
            }

            var result = new Dictionary<string, Item>();
            var query = contextItem?.GetHotelDesignsFolderQuery();
            if (string.IsNullOrEmpty(query))
            {
                return result;
            }

            var pageDesignsFolder = databaseProvider.SelectSingleItem(query);
            if (pageDesignsFolder == null)
            {
                return result;
            }

            foreach (Item design in pageDesignsFolder.Children)
            {
                var publishAble = design.Publishing.IsPublishable(DateTime.UtcNow, false);
                if (!publishAble)
                {
                    continue;
                }

                // Map hotel codes with page design.
                if (design.HasBaseTemplate(new TemplateID(Templates.HotelDesign.Id)) ||
                    design.HasBaseTemplate(new TemplateID(Templates.TradeHotelDesign.Id)))
                {
                    MultilistField field = design.Fields[Templates.HotelDesign.Fields.Hotels];

                    var hotelIds = field == null
                        ? new List<string>()
                        : field.GetItems()
                            .Where(hotel => hotel != null)
                            .SelectMany(hotel => hotel.Children.Where(child => child.TemplateID == Destinations.Constants.TemplateIds.AccommodationRoomsFolder))
                            .Select(roomsFolder => roomsFolder.Fields[Destinations.Constants.Fields.DatasourceItem.Code]?.Value?.ToUpper())
                            .Where(code => !string.IsNullOrEmpty(code))
                            .DistinctBy(code => code);

                    if (hotelIds != null)
                    {
                        foreach (var hotelId in hotelIds)
                        {
                            if (!result.ContainsKey(hotelId))
                            {
                                result.Add(hotelId, design);
                            }
                            else
                            {
                                logger.Warn($"Hotel design dictionary already contains key: {hotelId}", this);
                            }
                        }
                    }
                }
                else
                {
                    // Map theme with page design.
                    var type = design.Fields[Templates.HotelThemeDesign.Fields.Theme].Value?.ToUpper();
                    if (!string.IsNullOrEmpty(type))
                    {
                        if (!result.ContainsKey(type))
                        {
                            result.Add(type, design);
                        }
                        else
                        {
                            logger.Warn($"Hotel design dictionary already contains key: {type}", this);
                        }
                    }
                }
            }

            if (result.Any())
            {
                cache.StoreItem(cacheKey, result);
            }

            return result;
        }
    }
}
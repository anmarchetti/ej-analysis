using System;
using System.Collections;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.DependencyInjection;
using Sitecore.Diagnostics;
using Sitecore.Web.UI.Pages;

namespace easyJet.Foundation.Translation.Adaptor.Forms
{
    [ExcludeFromCodeCoverage]
    public class ExportSupportFormOverrides : DialogForm
    {
        private const string DoNotTranslateFieldName = "SkipTranslate";
        private readonly ID hotelPageTemplateId = new ID("{28E5E169-8F72-4F90-A277-280A8302B607}");

        public static void SearchForHotels(Item item, ArrayList itemsToTranslate)
        {
            Assert.IsNotNull(item, nameof(item));

            var itemPath = item.Paths.FullPath;
            var destinationsRepository = (IDestinationsRepository)ServiceLocator.ServiceProvider.GetService(typeof(IDestinationsRepository));
            var databaseProvider = (IDatabaseProvider)ServiceLocator.ServiceProvider.GetService(typeof(IDatabaseProvider));

            var hotelItems = destinationsRepository.GetAllHotels(itemPath).Select(x => databaseProvider.GetItem(x.Document.Uri)).Where(x => x != null);

            foreach (var hotel in hotelItems)
            {
                if (((CheckboxField)hotel.Fields[DoNotTranslateFieldName]).Checked)
                {
                    continue;
                }

                itemsToTranslate.Add(hotel);
                itemsToTranslate.AddRange(hotel.Axes.GetDescendants());
            }
        }

        public void RecurseDescendant(Item item, ArrayList itemsToTranslate, bool hotelsOnly)
        {
            if (hotelsOnly)
            {
                SearchForHotels(item, itemsToTranslate);
            }
            else
            {
                RecurseItems(item, itemsToTranslate);
            }
        }

        public void RecurseItems(Item item, ArrayList itemsToTranslate)
        {
            Assert.IsNotNull(item, nameof(item));
            var doNotTranslate = ((CheckboxField)item.Fields[DoNotTranslateFieldName])?.Checked ?? false;

            if (item.Versions.Count.Equals(0) || doNotTranslate || item.TemplateID.Equals(hotelPageTemplateId))
            {
                return;
            }

            if (!itemsToTranslate.Contains(item))
            {
                itemsToTranslate.Add(item);
            }

            foreach (Item child in item.Children)
            {
                RecurseItems(child, itemsToTranslate);
            }
        }
    }
}
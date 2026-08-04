using System.Linq;
using System.Web;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(ILuggageService), Lifetime = Lifetime.Transient)]
    public class LuggageService : ILuggageService
    {
        private readonly IHtmlCacheRepository cacheRepository;

        public LuggageService(IHtmlCacheRepository cacheRepository)
        {
            this.cacheRepository = cacheRepository;
        }

        public LuggageRoot GetLuggage(string language)
        {
            return cacheRepository.GetOrAdd<LuggageRoot>($"Destinations.Cache.LuggageItems", () =>
            {
                var luggageFolderItem = Context.Database.SelectSingleItem(
                    $"{Context.Site.RootPath}/Data/Ancillaries/*[@@templateId='{Constants.TemplateIds.LuggageFolder}']");
                if (luggageFolderItem == null)
                {
                    return new LuggageRoot();
                }

                var luggageFolderItemInLanguage = GetItemInLanguage(luggageFolderItem, language);

                var luggageItems = luggageFolderItemInLanguage.Children
                    .Select(MapLuggageCategory).ToList();

                return new LuggageRoot()
                {
                    LuggageCategories = luggageItems
                };
            });
        }

        private static Item GetItemInLanguage(Item luggageFolderItem, string language)
        {
            if (!Language.TryParse(language, out var parsedLanguage))
            {
                parsedLanguage = Context.Language;
            }

            if (luggageFolderItem.Language != parsedLanguage)
            {
                return ItemUtils.GetItemInLanguage(luggageFolderItem, parsedLanguage);
            }

            return luggageFolderItem;
        }

        private static string GetLuggageItemCode(Item contextItem, string sitecoreIdString)
        {
            var decodedIdString = HttpUtility.UrlDecode(sitecoreIdString);
            if (!ID.TryParse(decodedIdString, out var sitecoreItemId))
            {
                return null;
            }

            var luggageItem = contextItem.Database.GetItem(sitecoreItemId, contextItem.Language);
            if (luggageItem == null)
            {
                return null;
            }

            return luggageItem[Constants.Fields.LuggageItem.Code];
        }

        private LuggageCategory MapLuggageCategory(Item luggageCategoryItem)
        {
            return new LuggageCategory()
            {
                Code = luggageCategoryItem[Constants.Fields.LuggageCategory.Code],
                Name = luggageCategoryItem[Constants.Fields.LuggageCategory.Name],
                Type = luggageCategoryItem[Constants.Fields.LuggageCategory.Type],
                Children = luggageCategoryItem.Children.Select(MapLuggageItem).Where(luggageItem => luggageItem != null).ToList()
            };
        }

        private LuggageItemBase MapLuggageItem(Item luggageItem)
        {
            var description = luggageItem[Constants.Fields.LuggageItemBase.Description];
            var name = luggageItem[Constants.Fields.LuggageItemBase.Name];
            var icon = luggageItem.GetMediaUrl(Constants.Fields.LuggageItemBase.Icon);
            var isEnabled = FieldUtils.IsChecked(Constants.Fields.LuggageItemBase.IsLuggageItemEnabled, luggageItem);

            if (luggageItem.TemplateID == Constants.TemplateIds.LuggageItem)
            {
                return new LuggageItem()
                {
                    Code = luggageItem[Constants.Fields.LuggageItem.Code],
                    Description = description,
                    Name = name,
                    Icon = icon,
                    IsLuggageItemEnabled = isEnabled,
                    Type = nameof(LuggageItem)
                };
            }

            if (luggageItem.TemplateID == Constants.TemplateIds.CombinedLuggageItem)
            {
                var codes = FieldUtils
                    .GetNameValueListContentAsList(Constants.Fields.CombinedLuggageItem.CombinedLuggage, luggageItem)
                    .Select(i => GetLuggageItemCode(luggageItem, i.Value))
                    .Where(i => !string.IsNullOrEmpty(i))
                    .ToList();

                if (!codes.Any())
                {
                    return null;
                }

                return new CombinedLuggageItem()
                {
                    Codes = codes,
                    Description = description,
                    Name = name,
                    Icon = icon,
                    IsLuggageItemEnabled = isEnabled,
                    Type = nameof(CombinedLuggageItem)
                };
            }

            return null;
        }
    }
}
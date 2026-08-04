using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class BaseSearchParameters
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="BaseSearchParameters"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public BaseSearchParameters(Item item)
        {
            if (item == null)
            {
                return;
            }

            Name = item[Constants.Fields.DatasourceItem.Name];
            NumberOfAdults = MainUtil.GetInt(item[Constants.Fields.BasePaxMix.NumberOfAdults], 0);
            NumberOfChildren = MainUtil.GetInt(item[Constants.Fields.BasePaxMix.NumberOfChildren], 0);
            NumberOfInfants = MainUtil.GetInt(item[Constants.Fields.SearchParameters.NumberOfInfants], 0);
            DefaultDuration = MainUtil.GetInt(item[Constants.Fields.BasePaxMix.DefaultDuration], 0);
        }

        /// <summary>
        /// Sets child ages.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field name.</param>
        protected void SetChildAges(Item item, string fieldName)
        {
            ChildAges = item[fieldName]?.Split(new[] { ',' }, System.StringSplitOptions.RemoveEmptyEntries).ToList();
        }

        /// <summary>
        /// Sets theme types.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldNames">Field names that contain themes (e.g. hotel theme, hotel type).</param>
        protected void SetThemeTypes(Item item, string[] fieldNames)
        {
            var themeList = new List<HotelTheme>();

            foreach (var fieldName in fieldNames)
            {
                var types = ((MultilistField)item.Fields[fieldName])?.GetItems();
                if (types != null)
                {
                    themeList.AddRange(types.Select(x => new HotelTheme(x)));
                }
            }

            ThemeTypes = themeList;
        }

        /// <summary>
        /// Sets theme promo collection codes.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field name that contains promo collections.</param>
        protected void SetPromoCollections(Item item, string fieldName)
        {
            PromoCollections = item.GetItems(fieldName)
                .Select(x => x[Constants.Fields.PromotionCollectionItem.Key]).ToList();
        }

        /// <summary>
        /// Gets or sets name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets number of adults.
        /// </summary>
        public int NumberOfAdults { get; }

        /// <summary>
        /// Gets number of children.
        /// </summary>
        public int NumberOfChildren { get; }

        /// <summary>
        /// Gets number of infants.
        /// </summary>
        public int NumberOfInfants { get; }

        /// <summary>
        /// Gets default duration.
        /// </summary>
        public int DefaultDuration { get; }

        /// <summary>
        /// Gets or sets child ages.
        /// </summary>
        public List<string> ChildAges { get; set; }

        /// <summary>
        /// Gets or sets theme types.
        /// </summary>
        public List<HotelTheme> ThemeTypes { get; set; }

        /// <summary>
        /// Gets or sets promo collection codes.
        /// </summary>
        public List<string> PromoCollections { get; set; }
    }
}
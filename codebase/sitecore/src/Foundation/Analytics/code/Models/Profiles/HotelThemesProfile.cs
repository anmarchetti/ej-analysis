using easyJet.Foundation.Analytics.Models.Profiles.Base;
using Sitecore.Data;

namespace easyJet.Foundation.Analytics.Models.Profiles
{
    public class HotelThemesProfile : BaseProfile
    {
        public const string ProfileName = "Hotel Themes";

        protected override string Name => ProfileName;

        protected override ID Id => new ID("{C707F3DC-54CC-4E7D-8E3E-6C151DEEAFC8}");

        public HotelThemesProfile(int? beachValue, int? cityValue, int? lakeValue)
        {
            Beach = beachValue ?? 0;
            City = cityValue ?? 0;
            Lakes = lakeValue ?? 0;
        }

        public int Beach { get; }

        public int City { get; }

        public int Lakes { get; }

        /// <summary>
        /// Returns profile card name with maximum value.
        /// </summary>
        /// <returns>Card name.</returns>
        public string GetRelevantProfileCardName()
        {
            if (Beach > 0 && Beach >= City && Beach >= Lakes)
            {
                return nameof(Beach);
            }
            else if (City > 0 && City >= Lakes)
            {
                return nameof(City);
            }
            else if (Lakes > 0)
            {
                return nameof(Lakes);
            }

            return null;
        }
    }
}
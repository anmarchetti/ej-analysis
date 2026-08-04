using easyJet.Holidays.Api.Domain.Data.ReferenceData.Themes;

namespace easyJet.Holidays.Api.Domain.Data.Themes
{
    /// <summary>
    /// Theme model
    /// </summary>
    [Serializable]
    public class PackageTheme
    {
        /// <summary>
        /// Theme code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Name of the Theme
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Tracking Id
        /// </summary>
        public string TrackingId { get; set; }

        /// <summary>
        /// Item name of the Theme
        /// </summary>
        public string ItemName { get; set; }

        /// <summary>
        /// Type description
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Type icon
        /// </summary>
        public string Icon { get; set; }

        /// <summary>
        /// Theme types
        /// </summary>
        public List<ThemeType> Types { get; set; }

        /// <summary>
        /// Avalialbe package icons
        /// </summary>
        public List<PackageIcon> PackageIcons { get; set; }
    }

}

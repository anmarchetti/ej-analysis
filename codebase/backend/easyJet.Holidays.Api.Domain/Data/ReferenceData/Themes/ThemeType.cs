namespace easyJet.Holidays.Api.Domain.Data.Themes
{
    [Serializable]
    public record ThemeType
    {
        /// <summary>
        /// Hotel code
        /// </summary>
        public string Code { get; init; }

        /// <summary>
        /// Name of type
        /// </summary>
        public string Name { get; init; }

        /// <summary>
        /// Tracking Id
        /// </summary>
        public string TrackingId { get; set; }

        /// <summary>
        /// Item name of type
        /// </summary>
        public string ItemName { get; init; }

        /// <summary>
        /// Type description
        /// </summary>
        public string Description { get; init; }

        /// <summary>
        /// Icon
        /// </summary>
        public string Icon { get; init; }

        /// <summary>
        /// Filled Icon.
        /// </summary>
        public string FilledIcon { get; init; }

        /// <summary>
        /// Filled TypeAndThemeTitle.
        /// </summary>
        public string TypeAndThemeTitle { get; init; }

    }
}

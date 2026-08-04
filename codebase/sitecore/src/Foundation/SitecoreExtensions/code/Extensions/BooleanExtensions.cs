namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class BooleanExtensions
    {
        // Converts Boolean into Sitecore's CheckBox field value
        public static string GetBoolAsIntegerString(this bool value)
        {
            return (value ? 1 : 0).ToString();
        }

        // Converts Boolean into Sitecore's CheckBox field value
        public static string GetBoolAsIntegerString(this bool? value)
        {
            return (value.HasValue && value.Value ? 1 : 0).ToString();
        }
    }
}
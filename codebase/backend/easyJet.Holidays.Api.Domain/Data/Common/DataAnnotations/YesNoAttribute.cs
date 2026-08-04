using System.ComponentModel.DataAnnotations;


namespace easyJet.Holidays.Api.Domain.Data.Common.DataAnnotations
{
    /// <summary>
    /// Attribute to validate Yes/No properties
    /// </summary>
    public class YesNoAttribute : RegularExpressionAttribute
    {
        private const string RegexPattern = "[YyNn]{1}";

        /// <summary>
        /// Attribute to validate Yes/No properties
        /// </summary>
        public YesNoAttribute() : base(RegexPattern)
        {
        }
    }
}

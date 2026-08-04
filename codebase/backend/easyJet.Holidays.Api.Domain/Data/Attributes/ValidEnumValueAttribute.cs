using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes
{
    /// <summary>
    /// Validate that property is valid Enum value
    /// </summary>
    public class ValidEnumValueAttribute : ValidationAttribute
    {
        private Type EnumType { get; set; }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="enumType">Enym type</param>
        public ValidEnumValueAttribute(Type enumType)
        {
            EnumType = enumType;
        }

        public override bool IsValid(object value)
        {
            if (value == null) return false;

            try
            {
                // EnumType is generic value, that's why we don't use TryParse here. Exception is better/faster than reflection
                Enum.Parse(EnumType, value?.ToString(), true);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}

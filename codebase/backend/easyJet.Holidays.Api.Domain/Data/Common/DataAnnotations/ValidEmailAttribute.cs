using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Common.DataAnnotations;

/// <summary>
/// Attribute to validate Email. the regex should correspond to the FE email regex. if not - compare and update
/// </summary>
public class ValidEmailAttribute : RegularExpressionAttribute
{
    private const string RegexPattern = "^([a-zA-Z0-9_+\\-\\.\']+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9\\-]+\\.)+))([a-zA-Z]{2,12}|[0-9]{1,12})(\\]?)$";

    /// <summary>
    /// Attribute to validate Email. the regex should correspond to the FE email regex. if not - compare and update
    /// </summary>
    public ValidEmailAttribute() : base(RegexPattern)
    {
    }
}
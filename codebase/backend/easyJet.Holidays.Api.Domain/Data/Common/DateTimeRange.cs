using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Data.Common
{
    /// <summary>
    /// Represents time frame defined by start and end date
    /// </summary>
    [ExcludeFromCodeCoverage]
    public record DateTimeRange(DateTime From, DateTime To);
}

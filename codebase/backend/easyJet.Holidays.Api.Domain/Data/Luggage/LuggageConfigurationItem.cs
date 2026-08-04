namespace easyJet.Holidays.Api.Domain.Data.Luggage;

/// <summary>
/// Luggage configuration aggregation.
/// </summary>
public record LuggageConfigurationItem(
    string Code,
    string CategoryCode,
    string Name,
    string Description,
    string Icon
);
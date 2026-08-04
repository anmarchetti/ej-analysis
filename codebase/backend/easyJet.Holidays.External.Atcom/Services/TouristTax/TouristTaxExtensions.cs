using Microsoft.Extensions.DependencyInjection;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

/// <summary>
/// Extensions for TouristTax functionality
/// </summary>
public static class TouristTaxExtensions
{
    /// <summary>
    /// adds the internal tourist tax types to the provided service collection
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static IServiceCollection RegisterTouristTax(this IServiceCollection instance)
    {
        instance.AddScoped<IErrorBasedCalculator, ErrorBasedCalculator>();
        instance.AddScoped<INoTaxCalculator, NoTaxCalculator>();
        instance.AddScoped<IPaxCalculator, PaxBased>();
        instance.AddScoped<IRoomCalculator, RoomBased>();
        instance.AddScoped<IPercentageCalculator, PercentageBased>();
        instance.AddScoped<ITouristTaxRepository, TouristTaxRepository>();
        instance.AddScoped<ITouristTaxCalculator, TouristTaxCalculator>();

        return instance;
    }
}
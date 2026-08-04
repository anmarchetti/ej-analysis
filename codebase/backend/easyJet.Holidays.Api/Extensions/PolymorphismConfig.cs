using easyJet.Holidays.Api.Domain.Data.Payment;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.Api.Extensions;

/// <summary>
/// Polymorphism Config
/// </summary>
public class PolymorphismConfig
{
    /// <summary>
    /// Base Type
    /// </summary>
    public Type BaseType { get; init; }

    /// <summary>
    /// Discriminator
    /// </summary>
    public string Discriminator { get; init; }

    /// <summary>
    /// SubTypes
    /// </summary>
    public Collection<Type> SubTypes { get; init; }
}
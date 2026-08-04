using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.AWS.Domain.Models;
using easyJet.Holidays.External.DataHub.SoapReference;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.DatahubSync.Builder;

/// <summary>
/// Defines a contract for building `BookingSyncTransferWrapper` instances.
/// This builder interface is responsible for encapsulating data
/// from a `ReservationDataResponse` along with a collection of
/// `SpecialRequestsGroup` to construct domain models used in external
/// AWS booking synchronization workflows.
/// </summary>
public interface IBookingSyncTransferWrapperBuilder
{
    /// <summary>
    /// Constructs an instance of BookingSyncTransferWrapper using the provided reservation data,
    /// special request groups, and display response information.
    /// </summary>
    /// <param name="dataHubResponse">The response retrieved from DataHub containing reservation data.</param>
    /// <param name="specialRequestGroups">A collection of special request groups related to the booking.</param>
    /// <param name="displayResponse">The display response associated with the booking for additional presentation details.</param>
    /// <returns>A fully constructed BookingSyncTransferWrapper incorporating the provided data.</returns>
    BookingSyncTransferWrapper Build(
        ReservationDataResponse dataHubResponse,
        IEnumerable<SpecialRequestsGroup>? specialRequestGroups,
        DisplayResponse? displayResponse);
}

/// <summary>
/// Provides functionality to build a `BookingSyncTransferWrapper`, which encapsulates
/// both the raw `DataHubResponse` data. This class
/// integrates the reservation data and special request details required for further
/// processing or transmission.
/// </summary>
[ExcludeFromCodeCoverage]
public class BookingSyncTransferWrapperBuilder : IBookingSyncTransferWrapperBuilder
{

    /// <summary>
    /// Builds the final wrapper that goes up to SNS,
    /// containing both the raw DataHubResponse and
    /// our own DisplayResponse projection.
    /// </summary>
    public BookingSyncTransferWrapper Build(
        ReservationDataResponse dataHubResponse,
        IEnumerable<SpecialRequestsGroup>? specialRequestGroups,
        DisplayResponse? displayResponse)
    {
        ArgumentNullException.ThrowIfNull(specialRequestGroups);
        ArgumentNullException.ThrowIfNull(dataHubResponse);

        return new BookingSyncTransferWrapper
        {
            ReservationDataResponse = dataHubResponse,
            SpecialRequests = [..specialRequestGroups],
            DisplayResponse = displayResponse,
        };
    }
}
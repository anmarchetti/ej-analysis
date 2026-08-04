using easyJet.Holidays.External.Data8.Models;

namespace easyJet.Holidays.External.Data8.Ancillaries;

/// <summary>
/// Provides address lookup operations for search and retrieval.
/// </summary>
public interface IAddressLookupService
{
    /// <summary>
    /// Searches for matching address suggestions.
    /// </summary>
    /// <param name="addressToFind">Address text entered by the user.</param>
    /// <param name="countryCode"></param>
    /// <param name="cancellationToken">Request cancellation token.</param>
    /// <returns>Matching address suggestions.</returns>
    Task<SearchAddressResponse> LookupAddress(string addressToFind, string countryCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves full address details by Data8 value identifier.
    /// </summary>
    /// <param name="value">Data8 value identifier.</param>
    /// <param name="countryCode"></param>
    /// <param name="cancellationToken">Request cancellation token.</param>
    /// <returns>Resolved address details.</returns>
    Task<AddressResult> RetrieveAddress(string value, string countryCode, CancellationToken cancellationToken = default);
}


/// <summary>
/// Default implementation of <see cref="IAddressLookupService"/>.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="AddressLookupService"/> class.
/// </remarks>
/// <param name="data8Adapter">Data8 adapter.</param>
public class AddressLookupService(IData8Adapter data8Adapter) : IAddressLookupService
{
    private readonly IData8Adapter _data8Adapter = data8Adapter;

    /// <inheritdoc />
    public Task<SearchAddressResponse> LookupAddress(string addressToFind, string countryCode, CancellationToken cancellationToken = default)
    {
        return _data8Adapter.LookupAddress(addressToFind, countryCode, cancellationToken);
    }

    /// <inheritdoc />
    public Task<AddressResult> RetrieveAddress(string value, string countryCode, CancellationToken cancellationToken = default)
    {
        return _data8Adapter.RetrieveAddress(value, countryCode, cancellationToken);
    }
}

using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Hotels;
/// <summary>
/// AccomodationsSearchRequestBody
/// </summary>
public class AccomodationsSearchRequestBody
{
    /// <summary>
    /// Gets or sets the codes.
    /// </summary>
    public IEnumerable<string> Codes { get; set; }
}
/// <summary>
/// The accomodations search request.
/// </summary>

public class AccomodationsSearchRequest : JsonApiRequest<AccomodationsSearchRequestBody>
{
    /// <inheritdoc/>
    public override HttpMethod Method => HttpMethod.Post;
}

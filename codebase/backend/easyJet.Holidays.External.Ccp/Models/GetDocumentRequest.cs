using easyJet.Holidays.External.Domain.Models.Api;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.Ccp.Models
{
    /// <summary>
    /// Represents a request to retrieve a document via a GET HTTP method.
    /// </summary>
    /// <remarks>
    /// The <c>GetDocumentRequest</c> class extends <see cref="JsonApiRequest{T}"/> with a
    /// type parameter of <c>object</c> and overrides the HTTP method to <c>HttpMethod.Get</c>.
    /// It is utilized primarily for fetching documents from configured endpoints in
    /// conjunction with CCP services.
    /// </remarks>
    /// <seealso cref="JsonApiRequest{T}"/>
    /// <seealso cref="ApiRequest"/>
    public class GetDocumentRequest : JsonApiRequest<object>
    {
        /// <summary>
        /// Overrides the base class property to specify the HTTP method used for the API request.
        /// In this implementation, the method is set to HTTP GET.
        /// </summary>
        /// <remarks>
        /// The property returns an <see cref="HttpMethod"/> object that indicates the HTTP verb to be used
        /// when making the corresponding API call.
        /// </remarks>
        public override HttpMethod Method => HttpMethod.Get;
    }
}
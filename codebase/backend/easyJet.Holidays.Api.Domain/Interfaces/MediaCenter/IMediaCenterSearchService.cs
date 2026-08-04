using easyJet.Holidays.Api.Domain.Data.MediaCenter;

namespace easyJet.Holidays.Api.Domain.Interfaces.MediaCenter
{
    public interface IMediaCenterSearchService
    {
        /// <summary>
        /// Get articles by requestBody param.
        /// </summary>
        /// <param name="requestBody">Object contains criterias to look articles for.</param>
        /// <returns>Founded articles.</returns>
        Task<ArticlesResponse> GetArticles(ArticlesRequest requestBody);

        /// <summary>
        /// Get all available topics.
        /// </summary>
        /// <returns>Available topics.</returns>
        Task<string[]> GetTopics();
    }
}

using easyJet.Holidays.Api.Domain.Data.Feefo;
using easyJet.Holidays.External.Feefo.Models.DTO;
using easyJet.Holidays.External.Feefo.Models.EnterSale;

namespace easyJet.Holidays.External.Feefo.Interfaces
{
    public interface IFeefoService
    {
        Task<bool> SendData(FeefoEnterSale feefoEnterSale);

        Task<List<Review>> GetServiceReviews(FeefoReviewsSearchRequest feefoReviewsSearchRequest);

        Task<ReviewSummary> GetServiceReviewsSummary();

        Task<ReviewsAndSummary> GetServiceReviewsAndSummary(FeefoReviewsSearchRequest feefoReviewsSearchRequest);
    }
}

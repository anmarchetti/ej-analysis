namespace easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;


/// <summary>
/// Interface for repository to retrieve discounted offers data.
/// </summary>
public interface IHbgHotelDiscountsRepository
{
    /// <summary>
    /// Returns all discounted offers from DynamoDB.
    /// </summary>
    /// <returns></returns>
    Task<List<Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>> GetAll();
}
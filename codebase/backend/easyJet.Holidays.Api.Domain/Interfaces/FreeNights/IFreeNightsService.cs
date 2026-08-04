using easyJet.Holidays.Api.Domain.Data.DynamoDB.FreeNights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.FreeNights
{
    public interface IFreeNightsService
    {
        /// <summary>
        /// Get all items from table
        /// </summary>
        /// <returns></returns>
        Task<IEnumerable<AccomFreeNights>> GetAll();

        /// <summary>
        /// Get item by primary key
        /// </summary>
        /// <param name="accomId"></param>
        /// <returns></returns>
        Task<AccomFreeNights> Get(string accomId);

        /// <summary>
        /// Delete all items from table
        /// </summary>
        Task DeleteAll();

        /// <summary>
        /// Put items into table
        /// </summary>
        /// <param name="accomFreeNights"></param>
        /// <returns></returns>
        Task Put(IEnumerable<AccomFreeNights> accomFreeNights);


        /// <summary>
        /// Enrich unit models in offer with free nigths promo
        /// </summary>
        /// <param name="offers"></param>
        /// <returns></returns>
        Task EnrichWithFreeNightsInfo(IEnumerable<Offer> offers);

        /// <summary>
        /// Enrich unit models with free nigths promo based on conditions
        /// </summary>
        /// <param name="accomCode"></param>
        /// <param name="startDate"></param>
        /// <param name="stay"></param>
        /// <param name="units"></param>
        /// <returns></returns>
        Task EnrichWithFreeNightsInfo(string accomCode, DateTime? startDate, byte? stay,
            IEnumerable<Unit> units);
    }
}
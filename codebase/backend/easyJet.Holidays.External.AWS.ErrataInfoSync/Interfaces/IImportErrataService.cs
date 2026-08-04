using easyJet.Holidays.Api.Domain.Data.ErrataInfo;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;

/// <summary>
/// 
/// </summary>
public interface IImportErrataService
{
    /// <summary>
    /// Fetch Errata data from database
    /// </summary>
    /// <returns></returns>
    Task<List<HotelErrataModel>> GetErrataInfo();
}
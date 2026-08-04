using System.Data;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;


/// <summary>
/// 
/// </summary>
public interface IAtcomErrataOracleService
{
    /// <summary>
    /// 
    /// </summary>
    /// <returns></returns>
    DataTable GetAtcomDataTable();
}
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;

namespace easyJet.Holidays.External.Atcom.Mappers.Utils
{
    /// <summary>
    /// VRP requests utils
    /// </summary>
    public static class VrpRequestUtils
    {
        /// <summary>
        /// Build Adm property with:
        /// - ReqId - new Guid
        /// - Tm - current UTC date time
        /// - Trk:From - easyJet
        /// - Trk:To - atcomres
        /// </summary>
        /// <returns></returns>
        public static Adm BuildAdm()
        {
            return new Adm
            {
                ReqId = Guid.NewGuid().ToString(),
                Tm = DateFormatUtils.Utc(DateTimeOffset.UtcNow.UtcDateTime),
                Trk = new Trk
                {
                    From = TrkFrom.easyjet,
                    To = TrkTO.atcomres
                }
            };
        }
    }
}

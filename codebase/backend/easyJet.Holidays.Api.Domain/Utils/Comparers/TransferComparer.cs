using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Utils.Comparers
{
    /// <summary>
    /// Compare transfers
    /// </summary>
    public static class TransferComparer
    {
        /// <summary>
        /// Compare all transfers
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <returns></returns>
        public static bool Equals(List<TransferItem> x, List<TransferItem> y)
        {
            if (x.Count != y.Count)
                return false;

            for (int i = 0; i < x.Count; i++)
            {
                if (!x[i].Code.Equals(y[i].Code, StringComparison.CurrentCultureIgnoreCase))
                    return false;
            }

            return true;
        }
    }
}

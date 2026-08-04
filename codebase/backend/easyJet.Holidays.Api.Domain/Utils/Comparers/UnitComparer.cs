using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Utils.Comparers
{
    /// <summary>
    /// Unit comparer
    /// </summary>
    public static class UnitComparer
    {
        /// <summary>
        /// Compare units room type and board
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <returns></returns>
        public static bool Equals(List<Unit> x, List<Unit> y)
        {
            if (x.Count != y.Count)
                return false;

            for (int i = 0; i < x.Count; i++)
            {
                if (!x[i].Board.Equals(y[i].Board, StringComparison.CurrentCultureIgnoreCase))
                    return false;

                if (!x[i].Code.Equals(y[i].Code, StringComparison.CurrentCultureIgnoreCase))
                    return false;
            }
            return true;
        }
    }
}

namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Compares DestinationItem by DestinationItem.Code
    /// </summary>
    public class DestinationItemComparer : IEqualityComparer<DestinationItem>
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <returns></returns>
        public bool Equals(DestinationItem x, DestinationItem y)
        {
            if (ReferenceEquals(x, y)) return true;
            if (ReferenceEquals(x, null)) return false;
            if (ReferenceEquals(y, null)) return false;
            if (x.GetType() != y.GetType()) return false;
            return x.Code == y.Code;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="obj"></param>
        /// <returns></returns>
        public int GetHashCode(DestinationItem obj)
        {
            return (obj.Code != null ? obj.Code.GetHashCode() : 0);
        }
    }
}
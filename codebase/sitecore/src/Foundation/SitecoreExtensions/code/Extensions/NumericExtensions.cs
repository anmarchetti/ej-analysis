namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class NumericExtensions
    {
        public static int Clamp(this int val, int min, int max)
        {
            if (val < min)
            {
                return min;
            }

            if (val > max)
            {
                return max;
            }

            return val;
        }
    }
}
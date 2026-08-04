namespace easyJet.Holidays.Api.Domain.Utils
{
    public class MathUtils
    {
        /// <summary>
        /// Returns collection of all combinations which gives in total required sum
        /// </summary>
        /// <param name="items">Items collection</param>
        /// <param name="getValue">FUnction to get item value</param>
        /// <param name="target">Target value</param>
        public static IEnumerable<IEnumerable<T>> SubsetSum<T>(List<T> items, Func<T, decimal> getValue, decimal target)
        {
            if (items == null) return new List<List<T>>();

            var result = new List<List<T>>();
            SubsetSumRecursive(items, getValue, target, new List<T>(), result);
            return result;
        }

        /// <summary>
        /// Returns distance in km between 2 points on Earth using Haversine formula. https://stackoverflow.com/a/60899418
        /// </summary>
        /// <returns></returns>
        public static double GetDistance(double lat1, double lon1, double lat2, double lon2)
        {
            double rad(double angle) => angle * 0.017453292519943295769236907684886127d; // = angle * Math.Pi / 180.0d
            double havf(double diff) => Math.Pow(Math.Sin(rad(diff) / 2d), 2); // = sin²(diff / 2)
            return 12745.6 * Math.Asin(Math.Sqrt(havf(lat2 - lat1) + Math.Cos(rad(lat1)) * Math.Cos(rad(lat2)) * havf(lon2 - lon1))); // earth radius 6.372,8km x 2 = 12745.6
        }

        private static void SubsetSumRecursive<T>(List<T> numbers, Func<T, decimal> getValue, decimal target, List<T> partial, List<List<T>> result)
        {
            decimal sum = partial.Sum(getValue);

            if (sum == target)
            {
                result.Add(partial);
            }

            if (sum >= target) return;

            for (int i = 0; i < numbers.Count; i++)
            {
                var n = numbers[i];
                var remaining = numbers.Skip(i + 1).ToList();
                var partialRec = new List<T>(partial);
                partialRec.Add(n);
                SubsetSumRecursive(remaining, getValue, target, partialRec, result);
            }
        }
    }
}

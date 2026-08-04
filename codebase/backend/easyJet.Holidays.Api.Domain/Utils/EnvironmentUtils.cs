namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary>
    /// Extensions and utilities for System.Environment
    /// </summary>
    public static class EnvironmentUtils
    {
        /// <summary>
        /// Get environment variable or throws exception if value is null
        /// </summary>
        /// <param name="variable">Name of variable to get</param>
        /// <returns></returns>
        public static string GetVariableOrThrow(string variable)
        {
            return Environment.GetEnvironmentVariable(variable) ?? throw new Exception($"Missing value for variable: {variable}");
        }
    }
}

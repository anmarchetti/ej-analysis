namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo.Services;

/// <summary>
/// An interface that defines a method for generating random numbers.
/// This allows for dependency injection and easier testing by enabling 
/// the mocking of random number generation behavior.
/// </summary>
public interface IRandomGenerator
{
    /// <summary>
    /// Returns a random double-precision floating point number 
    /// between 0.0 and 1.0.
    /// </summary>
    /// <returns>A double representing a random value.</returns>
    double NextDouble();
}

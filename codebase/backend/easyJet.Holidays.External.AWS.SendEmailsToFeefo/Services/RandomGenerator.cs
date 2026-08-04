using System.Diagnostics.CodeAnalysis;
using System.Security.Cryptography;

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo.Services;

/// <summary>
/// A concrete implementation of the IRandomGenerator interface.
/// This class uses the System.Random class to generate random numbers.
/// </summary>
[ExcludeFromCodeCoverage]
public class RandomGenerator : IRandomGenerator
{
    /// <summary>
    /// Returns a cryptographically secure random double-precision floating point number 
    /// between 0.0 and 1.0.
    /// </summary>
    /// <returns>A double representing a secure random value.</returns>
    public double NextDouble()
    {
        // Buffer to hold the random number bytes.
        byte[] randomBytes = new byte[4];
        RandomNumberGenerator.Fill(randomBytes);

        // Convert to a UInt32 and normalize it to the range [0, 1).
        uint randomUInt = BitConverter.ToUInt32(randomBytes, 0);
        return randomUInt / (double)uint.MaxValue;
    }
}

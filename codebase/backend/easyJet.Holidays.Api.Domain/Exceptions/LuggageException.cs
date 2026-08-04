/// <summary>
/// Exception for luggage operations.
/// </summary>
public class LuggageException : Exception
{
    /// <inheritdoc />
    public LuggageException(string message) : base(message) { }

    /// <inheritdoc />
    public LuggageException(string message, Exception inner) : base(message, inner) { }
}
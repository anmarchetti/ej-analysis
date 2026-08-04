using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Transliteration
{
    public class TransliterationService : ITransliterationService
    {
        private readonly TransliterationSettings _transliterationSettings;

        public TransliterationService(IOptions<TransliterationSettings> transliterationSettings)
        {
            _transliterationSettings = transliterationSettings.Value ?? throw new ArgumentNullException(nameof(transliterationSettings));
        }

        /// <inheritdoc/>
        public string ToEnglish(string text)
        {
            if (string.IsNullOrEmpty(text))
                return text;

            return new string(TransliterateCharacters(text).ToArray());
        }

        private IEnumerable<char> TransliterateCharacters(string text)
        {
            for (var i = 0; i < text.Length; i++)
            {
                var character = text[i];
                var isDoubleCharacter = i < text.Length - 1 && _transliterationSettings.ComplexCharacters.Contains(text[i + 1].ToString());

                if (isDoubleCharacter)
                {
                    var doubleCharacter = text.Substring(i, 2);
                    if (_transliterationSettings.EnglishComplexCharactersLookUpTable.TryGetValue(doubleCharacter, out var result)
                        && !string.IsNullOrEmpty(result))
                    {
                        foreach (var c in result) yield return c;
                    }
                    else
                    {
                        throw new ArgumentException($"Text contains invalid character: {doubleCharacter}");
                    }

                    i++;
                }
                else
                {
                    if (TryLookUpCharacter(character, out var transliteratedCharacter) && !string.IsNullOrEmpty(transliteratedCharacter))
                    {
                        foreach (var c in transliteratedCharacter) yield return c;
                    }
                    else if (IsASCIICharacter(character))
                    {
                        yield return character;
                    }
                    else
                    {
                        throw new ArgumentException($"Text contains invalid character: {character}");
                    }
                }
            }
        }

        private bool TryLookUpCharacter(char character, out string result)
        {
            return (char.IsLower(character)
                        ? _transliterationSettings.EnglishSingleCharacterLowerCaseLookUpTable
                        : _transliterationSettings.EnglishSingleCharacterUpperCaseLookUpTable)
                    .TryGetValue(character.ToString(), out result);
        }

        private static bool IsASCIICharacter(char character)
        {
            return character < 128;
        }
    }
}

using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Services.Transliteration;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Transliteration
{
    public class TransliterationServiceTests
    {
        private ITransliterationService _sut;

        public TransliterationServiceTests()
        {
            _sut = new TransliterationService(Options.Create(new TransliterationSettings
            {
                EnglishSingleCharacterUpperCaseLookUpTable = new()
                {
                    { "‘", "'" },
                    { "’", "'" },
                    { "Á", "A" },
                    { "À", "A" },
                    { "Â", "A" },
                    { "Ä", "AE" },
                    { "Ã", "A" },
                    { "Ă", "A" },
                    { "Å", "AA" },
                    { "Ā", "A" },
                    { "Ą", "A" },
                    { "Ć", "C" },
                    { "Ĉ", "C" },
                    { "Č", "C" },
                    { "Ċ", "C" },
                    { "Ç", "C" },
                    { "Đ", "D" },
                    { "Ď", "D" },
                    { "É", "E" },
                    { "È", "E" },
                    { "Ê", "E" },
                    { "Ë", "E" },
                    { "Ě", "E" },
                    { "Ė", "E" },
                    { "Ē", "E" },
                    { "Ę", "E" },
                    { "Ĕ", "E" },
                    { "Ĝ", "G" },
                    { "Ğ", "G" },
                    { "Ġ", "G" },
                    { "Ģ", "G" },
                    { "Ħ", "H" },
                    { "Ĥ", "H" },
                    { "Í", "I" },
                    { "Ì", "I" },
                    { "Î", "I" },
                    { "Ï", "I" },
                    { "İ", "I" },
                    { "Ĩ", "I" },
                    { "Ī", "I" },
                    { "Ĭ", "I" },
                    { "Į", "I" },
                    { "Ĵ", "J" },
                    { "Ķ", "K" },
                    { "Ł", "L" },
                    { "Ĺ", "L" },
                    { "Ľ", "L" },
                    { "Ļ", "L" },
                    { "Ŀ", "L" },
                    { "Ń", "N" },
                    { "Ň", "N" },
                    { "Ñ", "N" },
                    { "Ņ", "N" },
                    { "Ø", "OE" },
                    { "Ó", "O" },
                    { "Ò", "O" },
                    { "Ô", "O" },
                    { "Ö", "OE" },
                    { "Õ", "O" },
                    { "Ő", "O" },
                    { "Ō", "O" },
                    { "Ŏ", "O" },
                    { "Ŕ", "R" },
                    { "Ŗ", "R" },
                    { "Ř", "R" },
                    { "Ś", "S" },
                    { "Ŝ", "S" },
                    { "Ş", "S" },
                    { "Š", "S" },
                    { "Ŧ", "T" },
                    { "Ť", "T" },
                    { "Ţ", "T" },
                    { "Ú", "U" },
                    { "Ù", "U" },
                    { "Û", "U" },
                    { "Ü", "UE" },
                    { "Ũ", "U" },
                    { "Ŭ", "U" },
                    { "Ű", "U" },
                    { "Ů", "U" },
                    { "Ū", "U" },
                    { "Ų", "U" },
                    { "Ŵ", "W" },
                    { "Ŷ", "Y" },
                    { "Ź", "Z" },
                    { "Ž", "Z" },
                    { "Ż", "Z" },
                    { "Ý", "Y" },
                    { "Ÿ", "Y" },
                    { "Þ", "TH" },
                    { "Æ", "AE" },
                    { "Ĳ", "IJ" },
                    { "Œ", "OE" },
                    { "А", "A" },
                    { "Б", "B" },
                    { "В", "V" },
                    { "Г", "G" },
                    { "Д", "D" },
                    { "Е", "E" },
                    { "Ё", "E" },
                    { "Ж", "ZH" },
                    { "З", "Z" },
                    { "И", "I" },
                    { "І", "I" },
                    { "Й", "I" },
                    { "К", "K" },
                    { "Л", "L" },
                    { "М", "M" },
                    { "Н", "N" },
                    { "О", "O" },
                    { "П", "P" },
                    { "Р", "R" },
                    { "С", "S" },
                    { "Т", "T" },
                    { "У", "U" },
                    { "Ф", "F" },
                    { "Х", "KH" },
                    { "Ц", "TS" },
                    { "Ч", "CH" },
                    { "Ш", "SH" },
                    { "Щ", "SHCH" },
                    { "Ы", "Y" },
                    { "Ъ", "IE" },
                    { "Э", "E" },
                    { "Ю", "IU" },
                    { "Я", "IA" },
                    { "Ѵ", "Y" },
                    { "Ґ", "G" },
                    { "Ў", "U" },
                    { "Ѫ", "U" },
                    { "Ƒ", "G" },
                    { "Ђ", "D" },
                    { "Ѕ", "DZ" },
                    { "Α", "A" },
                    { "Ά", "A" },
                    { "Β", "V" },
                    { "Γ", "G" },
                    { "Δ", "D" },
                    { "Ε", "E" },
                    { "Έ", "E" },
                    { "Ζ", "Z" },
                    { "Η", "I" },
                    { "Ή", "I" },
                    { "Θ", "TH" },
                    { "Ι", "I" },
                    { "Ί", "I" },
                    { "Ϊ", "I" },
                    { "Κ", "K" },
                    { "Λ", "L" },
                    { "Μ", "M" },
                    { "Ν", "N" },
                    { "Ξ", "X" },
                    { "Ο", "O" },
                    { "Ό", "O" },
                    { "Π", "P" },
                    { "Ρ", "R" },
                    { "Σ", "S" },
                    { "Τ", "T" },
                    { "Υ", "Y" },
                    { "Ύ", "Y" },
                    { "Ϋ", "Y" },
                    { "Φ", "F" },
                    { "Χ", "CH" },
                    { "Ψ", "PS" },
                    { "Ω", "O" },
                    { "Ώ", "O" },
                },
                EnglishSingleCharacterLowerCaseLookUpTable = new()
                {
                    { "á", "a" },
                    { "à", "a" },
                    { "â", "a" },
                    { "ä", "ae" },
                    { "ã", "a" },
                    { "ă", "a" },
                    { "å", "aa" },
                    { "ā", "a" },
                    { "ą", "a" },
                    { "ć", "c" },
                    { "ĉ", "c" },
                    { "č", "c" },
                    { "ċ", "c" },
                    { "ç", "c" },
                    { "đ", "d" },
                    { "ď", "d" },
                    { "é", "e" },
                    { "è", "e" },
                    { "ê", "e" },
                    { "ë", "e" },
                    { "ě", "e" },
                    { "ė", "e" },
                    { "ē", "e" },
                    { "ę", "e" },
                    { "ĕ", "e" },
                    { "ĝ", "g" },
                    { "ğ", "g" },
                    { "ġ", "g" },
                    { "ģ", "g" },
                    { "ħ", "h" },
                    { "ĥ", "h" },
                    { "í", "i" },
                    { "ì", "i" },
                    { "î", "i" },
                    { "ï", "i" },
                    { "ĩ", "i" },
                    { "ī", "i" },
                    { "ĭ", "i" },
                    { "į", "i" },
                    { "ĵ", "j" },
                    { "ķ", "k" },
                    { "ł", "l" },
                    { "ĺ", "l" },
                    { "ľ", "l" },
                    { "ļ", "l" },
                    { "ŀ", "l" },
                    { "ń", "n" },
                    { "ň", "n" },
                    { "ñ", "n" },
                    { "ņ", "n" },
                    { "ø", "oe" },
                    { "ó", "o" },
                    { "ò", "o" },
                    { "ô", "o" },
                    { "ö", "oe" },
                    { "õ", "o" },
                    { "ő", "o" },
                    { "ō", "o" },
                    { "ŏ", "o" },
                    { "ŕ", "r" },
                    { "ŗ", "r" },
                    { "ř", "r" },
                    { "ś", "s" },
                    { "ŝ", "s" },
                    { "ş", "s" },
                    { "š", "s" },
                    { "ŧ", "t" },
                    { "ť", "t" },
                    { "ţ", "t" },
                    { "ú", "u" },
                    { "ù", "u" },
                    { "û", "u" },
                    { "ü", "ue" },
                    { "ũ", "u" },
                    { "ŭ", "u" },
                    { "ű", "u" },
                    { "ů", "u" },
                    { "ū", "u" },
                    { "ų", "u" },
                    { "ŵ", "w" },
                    { "ŷ", "y" },
                    { "ź", "z" },
                    { "ž", "z" },
                    { "ż", "z" },
                    { "ý", "y" },
                    { "ÿ", "y" },
                    { "þ", "th" },
                    { "æ", "ae" },
                    { "ĳ", "ij" },
                    { "œ", "oe" },
                    { "ß", "ss" },
                    { "а", "a" },
                    { "б", "b" },
                    { "в", "v" },
                    { "г", "g" },
                    { "д", "d" },
                    { "е", "e" },
                    { "ё", "e" },
                    { "ж", "zh" },
                    { "з", "z" },
                    { "и", "i" },
                    { "і", "i" },
                    { "й", "i" },
                    { "к", "k" },
                    { "л", "l" },
                    { "м", "m" },
                    { "н", "n" },
                    { "о", "o" },
                    { "п", "p" },
                    { "р", "r" },
                    { "с", "s" },
                    { "т", "t" },
                    { "у", "u" },
                    { "ф", "f" },
                    { "х", "kh" },
                    { "ц", "ts" },
                    { "ч", "ch" },
                    { "ш", "sh" },
                    { "щ", "shch" },
                    { "ы", "y" },
                    { "ъ", "ie" },
                    { "э", "e" },
                    { "ю", "iu" },
                    { "я", "ia" },
                    { "ѵ", "y" },
                    { "ґ", "g" },
                    { "ў", "u" },
                    { "ѫ", "u" },
                    { "ƒ", "g" },
                    { "ђ", "d" },
                    { "ѕ", "dz" },
                    { "α", "a" },
                    { "ά", "a" },
                    { "β", "v" },
                    { "γ", "g" },
                    { "δ", "d" },
                    { "ε", "e" },
                    { "έ", "e" },
                    { "ζ", "z" },
                    { "η", "i" },
                    { "ή", "i" },
                    { "θ", "th" },
                    { "ι", "i" },
                    { "ί", "i" },
                    { "ϊ", "i" },
                    { "κ", "k" },
                    { "λ", "l" },
                    { "μ", "m" },
                    { "ν", "n" },
                    { "ξ", "x" },
                    { "ο", "o" },
                    { "ό", "o" },
                    { "π", "p" },
                    { "ρ", "r" },
                    { "σ", "s" },
                    { "τ", "t" },
                    { "υ", "y" },
                    { "ύ", "y" },
                    { "ϋ", "y" },
                    { "φ", "f" },
                    { "χ", "ch" },
                    { "ψ", "ps" },
                    { "ω", "o" },
                    { "ώ", "o" },
                },
                EnglishComplexCharactersLookUpTable = new()
                {
                    { "i̇", "i" },
                },
                ComplexCharacters = new[] { "̇" }
            }));
        }

        [Theory]
        [MemberData(nameof(InvalidCharacterTestCases))]
        public void ToEnglish_InvalidCharacter(string text, string invalidCharacter)
        {
            var result = Assert.Throws<ArgumentException>(() => _sut.ToEnglish(text));

            Assert.Equal($"Text contains invalid character: {invalidCharacter}", result.Message);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void ToEnglish_EmptyCharacterInLookUpTable(string mapAs)
        {
            var sut = new TransliterationService(Options.Create(new TransliterationSettings
            {
                EnglishSingleCharacterUpperCaseLookUpTable = new()
                {
                    { "Á", mapAs },
                },
                EnglishSingleCharacterLowerCaseLookUpTable = new(),
                EnglishComplexCharactersLookUpTable = new()
                {
                    { "i̇", "i" },
                },
                ComplexCharacters = new[] { "̇" }
            }));

            var result = Assert.Throws<ArgumentException>(() => sut.ToEnglish("Á"));

            Assert.Equal("Text contains invalid character: Á", result.Message);
        }

        [Theory]
        [MemberData(nameof(SuccessTestCases))]
        public void ToEnglish_Success(string text, string expected)
        {
            var result = _sut.ToEnglish(text);

            Assert.Equal(expected, result);
        }

        public static IEnumerable<object[]> InvalidCharacterTestCases()
        {
            yield return new object[]
            {
                "̇",
                "̇",
            };
            yield return new object[]
            {
                "ẋ",
                "ẋ"
            };
        }

        public static IEnumerable<object[]> EmptyCharacterInLookUpTableTestCases()
        {
            yield return new object[]
            {

            };
        }

        public static IEnumerable<object[]> SuccessTestCases()
        {
            yield return new object[]
            {
                "‘’",
                "''"
            };
            yield return new object[]
            {
                "ÁÀÂÄÃĂÅĀĄĆĈČĊÇĐĎÉÈÊËĚĖĒĘĔĜĞĠĢĦĤÍÌÎÏİĨĪĬĮĴĶŁĹĽĻĿŃŇÑŅØÓÒÔÖÕŐŌŎŔŖŘŚŜŞŠŦŤŢÚÙÛÜŨŬŰŮŪŲŴŶŹŽŻÝŸÞÆĲŒАБВГДЕЁЖЗИІЙКЛМНОПРСТУФХЦЧШЩЫЪЭЮЯѴҐЎѪƑЂЅΑΆΒΓΔΕΈΖΗΉΘΙΊΪΚΛΜΝΞΟΌΠΡΣΤΥΎΫΦΧΨΩΏ",
                "AAAAEAAAAAACCCCCDDEEEEEEEEEGGGGHHIIIIIIIIIJKLLLLLNNNNOEOOOOEOOOORRRSSSSTTTUUUUEUUUUUUWYZZZYYTHAEIJOEABVGDEEZHZIIIKLMNOPRSTUFKHTSCHSHSHCHYIEEIUIAYGUUGDDZAAVGDEEZIITHIIIKLMNXOOPRSTYYYFCHPSOO"
            };
            yield return new object[]
            {
                "áàâäãăåāąćĉčċçđďéèêëěėēęĕĝğġģħĥíìîïĩīĭįĵķłĺľļŀńňñņøóòôöõőōŏŕŗřśŝşšŧťţúùûüũŭűůūųŵŷźžżýÿþæĳœßабвгдеёжзиійклмнопрстуфхцчшщыъэюяѵґўѫƒђѕαάβγδεέζηήθιίϊκλμνξοόπρστυύϋφχψωώ",
                "aaaaeaaaaaacccccddeeeeeeeeegggghhiiiiiiiijklllllnnnnoeooooeoooorrrsssstttuuuueuuuuuuwyzzzyythaeijoessabvgdeezhziiiklmnoprstufkhtschshshchyieeiuiayguugddzaavgdeeziithiiiklmnxooprstyyyfchpsoo"
            };
            yield return new object[]
            {
                "i̇",
                "i"
            };
            yield return new object[]
            {
                "abc",
                "abc"
            };
            yield return new object[]
            {
                "ai̇bc",
                "aibc"
            };
        }
    }
}
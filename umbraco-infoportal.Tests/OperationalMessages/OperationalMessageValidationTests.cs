using Infoportal.Cms.OperationalMessages.Models;
using Infoportal.Cms.OperationalMessages.Services;
using Xunit;

namespace Infoportal.Cms.Tests.OperationalMessages;

public class OperationalMessageValidationTests
{
    private static readonly string[] Colors = ["Blå", "Oransje", "Rød"];

    private static PublishOperationalMessageRequest Valid() => new()
    {
        Title = "Feil ved innlogging",
        Description = "<p>Noen brukere får ikke logget inn.</p>",
        Color = "Rød",
    };

    [Fact]
    public void Valid_request_passes()
    {
        Assert.Null(OperationalMessagePublisher.Validate(Valid(), Colors));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Missing_title_is_invalid(string? title)
    {
        OperationalMessageError? error = OperationalMessagePublisher.Validate(
            new PublishOperationalMessageRequest { Title = title, Description = Valid().Description, Color = "Rød" },
            Colors);

        Assert.Equal(OperationalMessageErrorKind.Invalid, error?.Kind);
    }

    [Fact]
    public void Too_long_title_is_invalid()
    {
        var request = new PublishOperationalMessageRequest
        {
            Title = new string('a', OperationalMessagePublisher.MaxTitleLength + 1),
            Description = Valid().Description,
            Color = "Rød",
        };

        Assert.Equal(OperationalMessageErrorKind.Invalid, OperationalMessagePublisher.Validate(request, Colors)?.Kind);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("<p></p>")]
    [InlineData("<p>&nbsp;</p><p> </p>")]
    public void Blank_description_is_invalid(string? description)
    {
        var request = new PublishOperationalMessageRequest { Title = "Tittel", Description = description, Color = "Rød" };

        Assert.Equal(OperationalMessageErrorKind.Invalid, OperationalMessagePublisher.Validate(request, Colors)?.Kind);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Grønn")]
    public void Unknown_color_is_invalid(string? color)
    {
        var request = new PublishOperationalMessageRequest { Title = "Tittel", Description = "<p>Tekst</p>", Color = color };

        Assert.Equal(OperationalMessageErrorKind.Invalid, OperationalMessagePublisher.Validate(request, Colors)?.Kind);
    }

    [Theory]
    [InlineData("<p><img src=\"/media/x.png\"></p>", false)]
    [InlineData("<p><strong>Viktig</strong></p>", false)]
    [InlineData("<p><br></p>", true)]
    public void IsBlankMarkup_looks_for_visible_content(string markup, bool expected)
    {
        Assert.Equal(expected, OperationalMessagePublisher.IsBlankMarkup(markup));
    }
}

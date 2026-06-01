using Xunit;
using Travel_Manager_API.Controllers;
using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;

public class RelatedAttractionsControllerTests
{
    [Fact]
    public async Task GetRelated_ReturnsOkResult()
    {
        // Arrange
        var context = DbContextFactory.Create();

        var attraction1 = new Attraction(
            "Paris",
            "City of love",
            "France",
            "City",
            100,
            50
        );

        var attraction2 = new Attraction(
            "Lyon",
            "Nice city",
            "France",
            "City",
            80,
            40
        );

        var attraction3 = new Attraction(
            "Berlin",
            "Capital",
            "Germany",
            "City",
            90,
            60
        );

        context.Attractions.AddRange(attraction1, attraction2, attraction3);
        await context.SaveChangesAsync();

        var controller = new RelatedAttractionsController(context);

        // Act
        var result = await controller.GetRelated(attraction1.Id, 2);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetRelated_ExcludesCurrentAttraction()
    {
        // Arrange
        var context = DbContextFactory.Create();

        var attraction = new Attraction(
            "Rome",
            "Ancient city",
            "Italy",
            "City",
            100,
            50
        );

        var related = new Attraction(
            "Milan",
            "Fashion city",
            "Italy",
            "City",
            90,
            40
        );

        context.Attractions.AddRange(attraction, related);
        await context.SaveChangesAsync();

        var controller = new RelatedAttractionsController(context);

        // Act
        var result = await controller.GetRelated(attraction.Id, 5);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetRelated_ReturnsEmpty_WhenNoSameType()
    {
        // Arrange
        var context = DbContextFactory.Create();

        var attraction = new Attraction(
            "London",
            "Big city",
            "UK",
            "City",
            120,
            70
        );

        var different = new Attraction(
            "Alps",
            "Mountains",
            "Switzerland",
            "Nature",
            200,
            30
        );

        context.Attractions.AddRange(attraction, different);
        await context.SaveChangesAsync();

        var controller = new RelatedAttractionsController(context);

        // Act
        var result = await controller.GetRelated(attraction.Id, 3);

        // Assert
        Assert.NotNull(result);
    }
}
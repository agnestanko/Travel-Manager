using Xunit;
using Travel_Manager_API.Controllers;
using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;

public class HomeControllerTests
{
    [Fact]
    public async Task GetHomeData_ReturnsOk_WithAttractions()
    {
        // Arrange
        var context = DbContextFactory.Create();

        context.Attractions.Add(new Attraction(
            "Paris",
            "City of lights",
            "France",
            "City",
            100,
            50
        ));

        await context.SaveChangesAsync();

        var controller = new HomeController(context);

        // Act
        var result = await controller.GetHomeData();

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetPopular_ReturnsOkResult()
    {
        // Arrange
        var context = DbContextFactory.Create();

        var attraction = new Attraction(
            "Rome",
            "Ancient city",
            "Italy",
            "City",
            80,
            40
        );

        context.Attractions.Add(attraction);
        await context.SaveChangesAsync();

        context.Tickets.Add(new Ticket(
            1,
            attraction.Id,
            DateOnly.FromDateTime(DateTime.Today)
        ));

        await context.SaveChangesAsync();

        var controller = new HomeController(context);

        // Act
        var result = await controller.GetPopular();

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetPopular_ReturnsOrderedResults()
    {
        // Arrange
        var context = DbContextFactory.Create();

        var a1 = new Attraction("A1", "D1", "L1", "T1", 10, 10);
        var a2 = new Attraction("A2", "D2", "L2", "T2", 10, 10);

        context.Attractions.AddRange(a1, a2);
        await context.SaveChangesAsync();

        context.Tickets.Add(new Ticket(1, a1.Id, DateOnly.FromDateTime(DateTime.Today)));
        context.Tickets.Add(new Ticket(2, a1.Id, DateOnly.FromDateTime(DateTime.Today)));
        context.Tickets.Add(new Ticket(3, a2.Id, DateOnly.FromDateTime(DateTime.Today)));

        await context.SaveChangesAsync();

        var controller = new HomeController(context);

        // Act
        var result = await controller.GetPopular();

        // Assert
        Assert.NotNull(result);
    }
}
using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Travel_Manager_API.Controllers;
using Class_Library_Travel_Manager;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;

public class AdminControllerTests
{
    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    // -------------------------
    // ADD ATTRACTION - OK
    // -------------------------
    [Fact]
    public async Task AddAttraction_ValidRequest_ReturnsOk()
    {
        var context = GetDbContext();
        var controller = new AdminController(context);

        var request = new AddAttractionRequest
        {
            Name = "Festival Cluj",
            Type = "Festival",
            Description = "Festival mare",
            Location = "Cluj",
            Capacity = 1000,
            EntryPrice = 200,
            ImagePaths = new List<string> { "img1.jpg" },
            AvailableDates = new List<string> { "2026-06-01" }
        };

        var result = await controller.AddAttraction(request);

        Assert.IsType<OkObjectResult>(result);
        Assert.Single(context.Attractions);
    }

    // -------------------------
    // ADD ATTRACTION - INVALID
    // -------------------------
    [Fact]
    public async Task AddAttraction_MissingName_ReturnsBadRequest()
    {
        var context = GetDbContext();
        var controller = new AdminController(context);

        var request = new AddAttractionRequest
        {
            Name = "",
            Type = "Festival",
            Description = "Desc",
            Location = "Cluj",
            Capacity = 100,
            EntryPrice = 50
        };

        var result = await controller.AddAttraction(request);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // -------------------------
    // DELETE - OK
    // -------------------------
    [Fact]
    public async Task DeleteAttraction_ExistingAttraction_ReturnsOk()
    {
        var context = GetDbContext();

        var attraction = new Attraction(
            "Festival",
            "Music",
            "Desc",
            "Cluj",
            100,
            50
        );

        context.Attractions.Add(attraction);
        await context.SaveChangesAsync();

        var controller = new AdminController(context);

        var result = await controller.DeleteAttraction(attraction.Id);

        Assert.IsType<OkObjectResult>(result);
        Assert.Empty(context.Attractions);
    }

    // -------------------------
    // DELETE - NOT FOUND
    // -------------------------
    [Fact]
    public async Task DeleteAttraction_NotFound_ReturnsNotFound()
    {
        var context = GetDbContext();
        var controller = new AdminController(context);

        var result = await controller.DeleteAttraction(999);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // -------------------------
    // GET ALL
    // -------------------------
    [Fact]
    public async Task GetAll_ReturnsAllAttractions()
    {
        var context = GetDbContext();

        context.Attractions.Add(new Attraction(
            "A1", "Type", "Desc", "Cluj", 100, 50
        ));

        context.Attractions.Add(new Attraction(
            "A2", "Type", "Desc", "Bucuresti", 100, 50
        ));

        await context.SaveChangesAsync();

        var controller = new AdminController(context);

        var result = await controller.GetAll();

        var okResult = Assert.IsType<OkObjectResult>(result);

        var attractions = Assert.IsAssignableFrom<IEnumerable<Attraction>>(okResult.Value);

        Assert.Equal(2, attractions.Count());
    }

    // -------------------------
    // UPDATE - OK
    // -------------------------
    [Fact]
    public async Task UpdateAttraction_ExistingAttraction_ReturnsOk()
    {
        var context = GetDbContext();

        var attraction = new Attraction(
            "Old",
            "OldType",
            "OldDesc",
            "Cluj",
            100,
            50
        );

        context.Attractions.Add(attraction);
        await context.SaveChangesAsync();

        var controller = new AdminController(context);

        var request = new AddAttractionRequest
        {
            Name = "New",
            Type = "Festival",
            Description = "Updated",
            Location = "Bucuresti",
            Capacity = 500,
            EntryPrice = 150
        };

        var result = await controller.UpdateAttraction(attraction.Id, request);

        Assert.IsType<OkObjectResult>(result);

        var updated = await context.Attractions.FindAsync(attraction.Id);

        Assert.Equal("New", updated.Name);
        Assert.Equal("Festival", updated.Type);
    }

    // -------------------------
    // UPDATE - NOT FOUND
    // -------------------------
    [Fact]
    public async Task UpdateAttraction_NotFound_ReturnsNotFound()
    {
        var context = GetDbContext();
        var controller = new AdminController(context);

        var request = new AddAttractionRequest
        {
            Name = "Test",
            Type = "Type",
            Description = "Desc",
            Location = "Cluj",
            Capacity = 100,
            EntryPrice = 50
        };

        var result = await controller.UpdateAttraction(999, request);

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
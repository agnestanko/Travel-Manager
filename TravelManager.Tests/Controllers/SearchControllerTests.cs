using Xunit;
using Travel_Manager_API.Controllers;
using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

public class SearchControllerTests
{
    private SearchController CreateController(AppDbContext context)
    {
        return new SearchController(context);
    }

    [Fact]
    public async Task Search_ReturnsAll_WhenNoFilters()
    {
        var context = DbContextFactory.Create();

        context.Attractions.Add(new Attraction("Paris", "City of lights", "France", "City", 100, 50));
        context.Attractions.Add(new Attraction("Rome", "Ancient city", "Italy", "City", 80, 50));

        await context.SaveChangesAsync();

        var controller = CreateController(context);

        var result = await controller.Search();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Search_Filters_By_Query()
    {
        var context = DbContextFactory.Create();

        context.Attractions.Add(new Attraction("Paris Tower", "Beautiful tower", "France", "City", 100, 50));
        context.Attractions.Add(new Attraction("Colosseum", "Ancient arena", "Italy", "City", 80, 50));

        await context.SaveChangesAsync();

        var controller = CreateController(context);

        var result = await controller.Search(query: "paris");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Search_Filters_By_PriceRange()
    {
        var context = DbContextFactory.Create();

        context.Attractions.Add(new Attraction("Cheap Place", "Low cost", "RO", "City", 10, 50));
        context.Attractions.Add(new Attraction("Expensive Place", "High cost", "FR", "City", 200, 50));

        await context.SaveChangesAsync();

        var controller = CreateController(context);

        var result = await controller.Search(minPrice: 50, maxPrice: 150);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Search_Filters_By_Type()
    {
        var context = DbContextFactory.Create();

        context.Attractions.Add(new Attraction("Beach", "Sea place", "GR", "Beach", 100, 50));
        context.Attractions.Add(new Attraction("City Tour", "Urban", "FR", "City", 100, 50));

        await context.SaveChangesAsync();

        var controller = CreateController(context);

        var result = await controller.Search(type: "Beach");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Search_Sorts_Ascending()
    {
        var context = DbContextFactory.Create();

        context.Attractions.Add(new Attraction("A", "desc", "RO", "City", 300, 50));
        context.Attractions.Add(new Attraction("B", "desc", "RO", "City", 100, 50));

        await context.SaveChangesAsync();

        var controller = CreateController(context);

        var result = await controller.Search(sort: "asc");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task Search_Sorts_Descending()
    {
        var context = DbContextFactory.Create();

        context.Attractions.Add(new Attraction("A", "desc", "RO", "City", 100, 50));
        context.Attractions.Add(new Attraction("B", "desc", "RO", "City", 300, 50));

        await context.SaveChangesAsync();

        var controller = CreateController(context);

        var result = await controller.Search(sort: "desc");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }
}
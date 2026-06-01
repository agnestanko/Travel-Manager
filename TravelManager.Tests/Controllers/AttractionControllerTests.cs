using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel_Manager_API.Controllers;
using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TravelManager.Tests.Controllers
{
    public class AttractionControllerTests
    {
        private AppDbContext GetDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        // -------------------------
        // GET ALL
        // -------------------------
        [Fact]
        public async Task GetAll_ReturnsOk_WithData()
        {
            var context = GetDbContext();

            var attraction = new Attraction(
                "Castle",
                "Historic",
                "Nice place",
                "Cluj",
                10,
                100
            );

            attraction.Images = new List<AttractionImage>
            {
                new AttractionImage("img1.jpg")
            };

            context.Attractions.Add(attraction);
            await context.SaveChangesAsync();

            var controller = new AttractionController(context);

            var result = await controller.GetAll();

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            Assert.NotNull(ok.Value);
        }

        // -------------------------
        // GET BY ID - NOT FOUND
        // -------------------------
        [Fact]
        public async Task GetById_ReturnsNotFound_WhenMissing()
        {
            var context = GetDbContext();
            var controller = new AttractionController(context);

            var result = await controller.GetById(999);

            Assert.IsType<NotFoundResult>(result.Result);
        }

        // -------------------------
        // GET BY ID - OK
        // -------------------------
        [Fact]
        public async Task GetById_ReturnsAttraction_WhenExists()
        {
            var context = GetDbContext();

            var attraction = new Attraction(
                "Museum",
                "Museum",
                "Art museum",
                "Cluj",
                15,
                50
            );

            context.Attractions.Add(attraction);
            await context.SaveChangesAsync();

            var controller = new AttractionController(context);

            var result = await controller.GetById(attraction.Id);

            var ok = Assert.IsType<ActionResult<Attraction>>(result);
            Assert.NotNull(ok.Value);
            Assert.Equal("Museum", ok.Value!.Name);
        }

        // -------------------------
        // CREATE
        // -------------------------
        [Fact]
        public async Task Create_AddsAttraction_ReturnsCreated()
        {
            var context = GetDbContext();
            var controller = new AttractionController(context);

            var attraction = new Attraction(
                "Museum",
                "Museum",
                "Nice place",
                "Cluj",
                100,
                50
            );

            var result = await controller.Create(attraction);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);

            Assert.Equal("GetById", created.ActionName);
            Assert.Equal(1, context.Attractions.Count());
        }
    }
}
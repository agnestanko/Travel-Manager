using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Travel_Manager_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SearchController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attraction>>> Search(
        [FromQuery] string? query = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? type = null,
        [FromQuery] string? sort = null)
        {
            var queryable = _context.Attractions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(query))
                queryable = queryable.Where(a =>
                    a.Name.ToLower().Contains(query.ToLower()) ||
                    a.Description.ToLower().Contains(query.ToLower()) ||
                    a.Location.ToLower().Contains(query.ToLower()));

            if (minPrice.HasValue)
                queryable = queryable.Where(a => a.EntryPrice >= minPrice.Value);
            if (maxPrice.HasValue)
                queryable = queryable.Where(a => a.EntryPrice <= maxPrice.Value);
            if (!string.IsNullOrWhiteSpace(type))
                queryable = queryable.Where(a => a.Type == type);

            queryable = sort switch
            {
                "asc" => queryable.OrderBy(a => a.EntryPrice),
                "desc" => queryable.OrderByDescending(a => a.EntryPrice),
                _ => queryable
            };

            var results = await queryable.ToListAsync();
            return Ok(results);
        }
    }
}
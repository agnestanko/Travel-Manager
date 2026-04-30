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

        // GET: api/search?query=ceva
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attraction>>> Search(
        [FromQuery] string? query = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? location = null,
        [FromQuery] string? sort = null)
        {
            var queryable = _context.Attractions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(query))
                queryable = queryable.Where(a => a.Name.Contains(query) || a.Description.Contains(query));

            if (minPrice.HasValue)
                queryable = queryable.Where(a => a.EntryPrice >= minPrice.Value);
            if (maxPrice.HasValue)
                queryable = queryable.Where(a => a.EntryPrice <= maxPrice.Value);
            if (!string.IsNullOrWhiteSpace(location))
                queryable = queryable.Where(a => a.Location == location);

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
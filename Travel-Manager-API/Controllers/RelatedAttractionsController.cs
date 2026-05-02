using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Travel_Manager_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RelatedAttractionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RelatedAttractionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/relatedattractions/3?count=3
        [HttpGet("{id}")]
        public async Task<ActionResult<IEnumerable<object>>> GetRelated(int id, [FromQuery] int count = 3)
        {
            var related = await _context.Attractions
                .Where(a => a.Id != id)
                .OrderBy(a => Guid.NewGuid())
                .Take(count)
                .Include(a => a.Images)
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    FirstImage = a.Images!.Any() ? a.Images.First().ImagePath : null
                })
                .ToListAsync();

            return Ok(related);
        }
    }
}
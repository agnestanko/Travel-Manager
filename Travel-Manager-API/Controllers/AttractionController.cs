using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Travel_Manager_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttractionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttractionController(AppDbContext context)
        {
            _context = context;
        }

       [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            // Returnam atractiile impreuna cu prima imagine pentru cardurile din lista
            var attractions = await _context.Attractions
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    a.Description,
                    a.Location,
                    a.Type,
                    a.EntryPrice,
                    a.Capacity,
                    FirstImage = a.Images!.Any() ? a.Images.First().ImagePath : null
                })
                .ToListAsync();

            return Ok(attractions);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Attraction>> GetById(int id)
        {
            var attraction = await _context.Attractions
                .Include(a => a.Images)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (attraction == null)
                return NotFound();

            return attraction;
        }

        [HttpGet("{id}/available-dates")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableDates(int id)
        {
            var today = DateTime.UtcNow.Date;

            var dates = await _context.AvailableDates
                .Where(d => d.AttractionId == id && d.Date.ToUniversalTime() >= today)
                .OrderBy(d => d.Date)
                .Select(d => d.Date.ToUniversalTime().ToString("yyyy-MM-dd"))
                .ToListAsync();

            return Ok(dates);
        }

        [HttpPost]
        public async Task<ActionResult<Attraction>> Create(Attraction attraction)
        {
            _context.Attractions.Add(attraction);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = attraction.Id }, attraction);
        }
    }
}
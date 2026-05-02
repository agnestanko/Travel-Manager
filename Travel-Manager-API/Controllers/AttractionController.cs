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

        // GET: api/Attraction
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attraction>>> GetAll()
        {
            return await _context.Attractions
                .Include(a => a.Images)
                .ToListAsync();
        }

        // GET: api/Attraction/5
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

        // POST: api/Attraction
        [HttpPost]
        public async Task<ActionResult<Attraction>> Create(Attraction attraction)
        {
            _context.Attractions.Add(attraction);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = attraction.Id }, attraction);
        }
    }
}
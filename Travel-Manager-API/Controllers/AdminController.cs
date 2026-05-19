using Class_Library_Travel_Manager;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Travel_Manager_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("attractions")]
        public async Task<IActionResult> AddAttraction([FromBody] AddAttractionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.Type) ||
                string.IsNullOrWhiteSpace(request.Description) ||
                string.IsNullOrWhiteSpace(request.Location))
                return BadRequest("All fields are required.");

            var attraction = new Attraction(
                request.Name,
                request.Type,
                request.Description,
                request.Location,
                request.Capacity,
                request.EntryPrice
            );

            foreach (var imagePath in request.ImagePaths ?? new List<string>())
                attraction.Images.Add(new AttractionImage(imagePath));

            foreach (var date in request.AvailableDates ?? new List<string>())
            {
                if (DateTime.TryParse(date, out var parsedDate))
                    attraction.AvailableDates.Add(new AvailableDate(parsedDate.ToUniversalTime(), 0));
            }

            _context.Attractions.Add(attraction);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Attraction added successfully.", id = attraction.Id });
        }

        [HttpPut("attractions/{id}")]
        public async Task<IActionResult> UpdateAttraction(int id, [FromBody] AddAttractionRequest request)
        {
            var attraction = await _context.Attractions
                .Include(a => a.Images)
                .Include(a => a.AvailableDates)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (attraction == null)
                return NotFound("Attraction not found.");

            attraction.Name = request.Name;
            attraction.Type = request.Type;
            attraction.Description = request.Description;
            attraction.Location = request.Location;
            attraction.Capacity = request.Capacity;
            attraction.EntryPrice = request.EntryPrice;

            if (request.ImagePaths != null)
            {
                _context.AttractionImages.RemoveRange(attraction.Images);
                foreach (var imagePath in request.ImagePaths)
                    attraction.Images.Add(new AttractionImage(imagePath));
            }

            if (request.AvailableDates != null)
            {
                _context.AvailableDates.RemoveRange(attraction.AvailableDates);
                foreach (var date in request.AvailableDates)
                {
                    if (DateTime.TryParse(date, out var parsedDate))
                        attraction.AvailableDates.Add(new AvailableDate(parsedDate.ToUniversalTime(), 0));
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Attraction updated successfully." });
        }

        [HttpDelete("attractions/{id}")]
        public async Task<IActionResult> DeleteAttraction(int id)
        {
            var attraction = await _context.Attractions.FindAsync(id);
            if (attraction == null)
                return NotFound("Attraction not found.");

            _context.Attractions.Remove(attraction);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Attraction deleted successfully." });
        }

        [HttpGet("attractions")]
        public async Task<IActionResult> GetAll()
        {
            var attractions = await _context.Attractions
                .Include(a => a.Images)
                .Include(a => a.AvailableDates)
                .ToListAsync();
            return Ok(attractions);
        }
    }

    public class AddAttractionRequest
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public int Capacity { get; set; }
        public int EntryPrice { get; set; }
        public List<string>? ImagePaths { get; set; }
        public List<string>? AvailableDates { get; set; }
    }
}
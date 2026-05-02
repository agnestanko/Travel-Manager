namespace Class_Library_Travel_Manager
{
    public class AttractionImage
    {
        public int Id { get; set; }
        public string ImagePath { get; set; }
        public int AttractionId { get; set; }
        public Attraction Attraction { get; set; }

        private AttractionImage() { }

        public AttractionImage(string imagePath)
        {
            ImagePath = imagePath;
        }
    }
}
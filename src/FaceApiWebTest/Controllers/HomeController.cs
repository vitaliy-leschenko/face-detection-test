using FaceApiWebTest.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace FaceApiWebTest.Controllers
{
    [RequireHttps]
    public class HomeController : Controller
    {
        public IConfiguration Configuration { get; }

        public HomeController(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IActionResult Index()
        {
            var model = new ApiKeyModel()
            {
                AzureApiKey = Configuration["ApiKeys:Azure"],
                GoogleApiKey = Configuration["ApiKeys:Google"],
                AmazonAccessKeyId = Configuration["ApiKeys:Amazon:AccessKeyId"],
                AmazonSecretAccessKey = Configuration["ApiKeys:Amazon:SecretAccessKey"]
            };
            return View(model);
        }

        public async Task<IActionResult> Test()
        {
            var credentials = new Amazon.Runtime.BasicAWSCredentials(Configuration["ApiKeys:Amazon:AccessKeyId"], Configuration["ApiKeys:Amazon:SecretAccessKey"]);
            var region = Amazon.RegionEndpoint.USWest2;
            var client = new Amazon.Rekognition.AmazonRekognitionClient(credentials, region);
            Amazon.Rekognition.Model.DetectFacesRequest request = null;
            var response = await client.DetectFacesAsync(request);
            

            return null;
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}

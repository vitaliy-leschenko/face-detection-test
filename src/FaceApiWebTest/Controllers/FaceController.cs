using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Amazon.Rekognition;
using Amazon;
using Amazon.Runtime;
using Microsoft.Extensions.Configuration;
using Amazon.Rekognition.Model;
using System.IO;
using FaceApiWebTest.Models;
using System.Diagnostics;

namespace FaceApiWebTest.Controllers
{
    public class FaceController : Controller
    {
        public IConfiguration Configuration { get; }

        public FaceController(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        [HttpPost]
        [Route("api/face/detect")]
        public async Task<IActionResult> Post([FromBody] FaceDetectModel model)
        {
            var accessKeyId = Configuration["ApiKeys:Amazon:AccessKeyId"];
            var secretAccessKey = Configuration["ApiKeys:Amazon:SecretAccessKey"];

            var credentials = new BasicAWSCredentials(accessKeyId, secretAccessKey);
            var region = RegionEndpoint.USWest2;
            var client = new AmazonRekognitionClient(credentials, region);

            var bytes = Convert.FromBase64String(model.Data);
            using (var mem = new MemoryStream(bytes))
            {
                try
                {
                    var request = new DetectFacesRequest();// { Image = { Bytes = mem } };
                    request.Image = new Image();
                    request.Image.Bytes = mem;

                    var response = await client.DetectFacesAsync(request);
                    var results = from face in response.FaceDetails
                                  let box = face.BoundingBox
                                  select new
                                  {
                                      left = Math.Round(box.Left * model.Width),
                                      top = Math.Round(box.Top * model.Height),
                                      width = Math.Round(box.Width * model.Width),
                                      height = Math.Round(box.Height * model.Height)
                                  };
                    return Ok(results.ToList());
                }
                catch(Exception ex)
                {
                    Debug.WriteLine(ex.ToString());
                    return Ok(new object[0]);
                }
            }
        }
    }
}

using Newtonsoft.Json;
using System.Collections.Generic;

namespace FaceApiWebTest.Models
{
    public class GooglaFaceDetectionRequestModel
    {
        public class RequestModel
        {
            public class ImageModel
            {
                [JsonProperty("content")]
                public string Content { get; }

                public ImageModel(string data)
                {
                    Content = data;
                }
            }

            public class FeatureModel
            {
                [JsonProperty("type")]
                public string Type { get; set; }
                [JsonProperty("maxResults")]
                public int MaxResults { get; set; }
            }

            [JsonProperty("image")]
            public ImageModel Image { get; }
            [JsonProperty("features")]
            public List<FeatureModel> Features { get; } = new List<FeatureModel>
            {
                new FeatureModel
                {
                    Type = "FACE_DETECTION",
                    MaxResults = 10
                }
            };

            public RequestModel(string data)
            {
                Image = new ImageModel(data);
            }
        }

        [JsonProperty("requests")]
        public List<RequestModel> Requests { get; } = new List<RequestModel>();

        public GooglaFaceDetectionRequestModel(string data)
        {
            Requests.Add(new RequestModel(data));
        }
    }
}

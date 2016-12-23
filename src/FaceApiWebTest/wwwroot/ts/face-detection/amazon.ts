import * as R from "./rect";

var rekognition = new AWS.Rekognition({
    accessKeyId: 'AKIAJ4ANCQQKQ2UMGGLQ',
    secretAccessKey: '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',
    region: 'us-west-2'
});

export function faceDetectionAsync(width: number, height: number, content: ArrayBuffer): Promise<R.IRectangle[]> {
    return new Promise<R.IRectangle[]>((resolve, reject) => {
        const params = {
            Image: {
                Bytes: content
            }
        };
        rekognition.detectFaces(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                const result: R.IRectangle[] = data.FaceDetails.map(t => {
                    const box = t.BoundingBox;
                    const rect: R.IRectangle = {
                        left: Math.floor(box.Left * width),
                        top: Math.floor(box.Top * height),
                        width: Math.floor(box.Width * width),
                        height: Math.floor(box.Height * height)
                    };
                    return rect;
                });
                resolve(result);
            }
        });
    });
}

import * as R from "./rect";

interface ISecrets {
    accessKeyId: string;
    secretAccessKey: string;
}

export function faceDetectionAsync(width: number, height: number, content: ArrayBuffer, secrets: ISecrets): Promise<R.IRectangle[]> {
    return new Promise<R.IRectangle[]>((resolve, reject) => {
        var rekognition = new AWS.Rekognition({
            accessKeyId: secrets.accessKeyId,
            secretAccessKey: secrets.secretAccessKey,
            region: 'us-west-2'
        });
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

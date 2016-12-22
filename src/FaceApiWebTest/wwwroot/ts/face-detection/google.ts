import * as R from "./rect";

interface IVertex {
    x: number;
    y: number;
}

interface IBoundingPoly {
    vertices: IVertex[];
}

interface IFaceDetectionResponse {
    boundingPoly: IBoundingPoly;
}

export function faceDetectionAsync(content: string, apiKey: string): Promise<R.IRectangle[]> {
    //const authKey = "AIzaSyCt42CUKRGguaDQIOwKZaP6s_mWkeYYrQU";

    return new Promise<R.IRectangle[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.responseType = 'json';
        xhr.onload = e => {
            if (xhr.status === 200) {
                let response = xhr.response;
                if (typeof response === "string") {
                    response = JSON.parse(response);
                }

                const results: IFaceDetectionResponse[] = response.responses[0].faceAnnotations || [];
                const output: R.IRectangle[] = [];
                for (let result of results) {
                    const poly = result.boundingPoly;
                    let minx = poly.vertices[0].x || 0, miny = poly.vertices[0].y || 0,
                        maxx = minx, maxy = miny;
                    for (let t = 0; t < poly.vertices.length; t++) {
                        const x = poly.vertices[t].x || 0;
                        const y = poly.vertices[t].y || 0;

                        if (x < minx) minx = x;
                        if (x > maxx) maxx = x;
                        if (y < miny) miny = y;
                        if (y > maxy) maxy = y;
                    }
                    output.push({
                        left: minx,
                        top: miny,
                        width: maxx - minx + 1,
                        height: maxy - miny + 1
                    });
                }
                resolve(output);
            } else {
                reject("error");
            }
        };

        xhr.send(JSON.stringify({
            requests: [
                {
                    image: {
                        content: content
                    },
                    features: [{
                        type: "FACE_DETECTION",
                        maxResults: 5
                    }]
                }
            ]
        }));
    });
}

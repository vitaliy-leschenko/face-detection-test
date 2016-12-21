import sources from "./image-sources";
import loadBlobAsync from "./load-blob";
import loadImageAsync from "./load-image";
import blobToBase64Async from "./blob-to-base64";

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

function faceDetectionAsync(content: string): Promise<IFaceDetectionResponse[]> {
    const authKey = "AIzaSyCt42CUKRGguaDQIOwKZaP6s_mWkeYYrQU";

    return new Promise<IFaceDetectionResponse[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://vision.googleapis.com/v1/images:annotate?key=" + authKey, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.responseType = 'json';
        xhr.onload = e => {
            if (xhr.status === 200) {
                resolve(xhr.response.responses[0].faceAnnotations || []);
            } else {
                reject("error");
            }
        };

        const requests = {
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
        };

        xhr.send(JSON.stringify(requests));
    });
}

async function run() {
    const list = document.getElementById("list") as HTMLUListElement;

    try {
        let detected = 0;
        let total = 0;

        for (let src of sources()) {
            const blob = await loadBlobAsync(src);
            const img = await loadImageAsync(src);
            const content = await blobToBase64Async(blob);

            const result = await faceDetectionAsync(content);

            const li = document.createElement("li");

            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 200;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            for (let face of result) {
                const vertices = face.boundingPoly.vertices;

                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
                ctx.moveTo(vertices[0].x || 0, vertices[0].y || 0);

                for (let t = 1; t < vertices.length; t++) {
                    ctx.lineTo(vertices[t].x || 0, vertices[t].y || 0);
                }

                ctx.closePath();
                ctx.stroke();
            }

            li.appendChild(canvas);

            const p = document.createElement("p");
            if (result.length > 0) {
                p.style.fontWeight = "bold";
                p.innerText = "detected";
            } else {
                p.innerText = "no faces";
            }
            li.appendChild(p);

            list.appendChild(li);

            total++;
            if (result.length > 0) detected++;
        }

        const li = document.createElement("li");
        const p = document.createElement("p");
        p.innerText = `result: ${detected} / ${total}`;
        li.appendChild(p);

        list.appendChild(li);

    } catch (e) {
        const li = document.createElement("li");

        const p = document.createElement("p");
        p.innerText = e;
        li.appendChild(p);

        list.appendChild(li);
    }
}

run();

export = 0;
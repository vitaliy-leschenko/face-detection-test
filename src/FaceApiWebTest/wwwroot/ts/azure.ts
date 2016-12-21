import sources from "./image-sources";
import loadBlobAsync from "./load-blob";
import loadImageAsync from "./load-image";

interface IFaceDetectionResponse {
    faceId?: string;
    faceRectangle: {
        left: number;
        top: number;
        width: number;
        height: number;
    }
}

function faceDetectionAsync(blob: Blob): Promise<IFaceDetectionResponse[]> {
    return new Promise<IFaceDetectionResponse[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.projectoxford.ai/face/v1.0/detect?returnFaceId=true", true);
        xhr.setRequestHeader("Content-type", "application/octet-stream");
        xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "8d6d5f781e8e4d58befa313ce445d123");
        xhr.responseType = 'json';
        xhr.onload = e => {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject("error");
            }
        };

        xhr.send(blob);
    });
}


async function run(): Promise<void> {
    const list = document.getElementById("list") as HTMLUListElement;

    try {
        let detected = 0;
        let total = 0;

        for (let src of sources()) {
            const blob = await loadBlobAsync(src);
            const img = await loadImageAsync(src);
            const result = await faceDetectionAsync(blob);

            const li = document.createElement("li");

            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 200;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            for (let face of result) {
                const rect = face.faceRectangle;

                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
                ctx.rect(rect.left, rect.top, rect.width, rect.height);
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
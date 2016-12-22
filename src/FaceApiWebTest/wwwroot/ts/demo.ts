import sources from "./image-sources";
import loadBlobAsync from "./libs/load-blob";
import loadImageAsync from "./libs/load-image";
import blobToBase64Async from "./libs/blob-to-base64";

import * as R from "./face-detection/rect";
import * as azure from "./face-detection/azure";
import * as google from "./face-detection/google";
import * as detector from "./face-detection/detector";
import * as api from "./api-keys";

function drawRects(rects: R.IRectangle[], style: string, ctx: CanvasRenderingContext2D): void {
    for (let rect of rects) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = style;
        ctx.rect(rect.left, rect.top, rect.width, rect.height);
        ctx.stroke();
    }
}

function update(a: number, g: number, d: number): void {
    document.getElementById("azureResults").innerText = a.toString();
    document.getElementById("googleResults").innerText = g.toString();
    document.getElementById("detectorResults").innerText = d.toString();
}

async function run(): Promise<void> {
    const list = document.getElementById("list") as HTMLUListElement;

    try {
        let azureCount = 0;
        let googleCount = 0;
        let detectorCount = 0;

        for (let src of sources()) {
            const blob = await loadBlobAsync(src);
            const img = await loadImageAsync(src);

            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 200;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            const googleResult = document.createElement("span");
            const azureResult = document.createElement("span");
            const detectorResult = document.createElement("span");
            googleResult.innerText = "google";
            googleResult.style.color = "red";
            googleResult.style.display = "none";
            azureResult.innerText = "azure";
            azureResult.style.color = "blue";
            azureResult.style.display = "none";
            detectorResult.innerText = "detector";
            detectorResult.style.color = "black";
            detectorResult.style.display = "none";

            const li = document.createElement("li");
            li.appendChild(canvas);
            const p = document.createElement("p");
            p.appendChild(googleResult);
            p.appendChild(azureResult);
            p.appendChild(detectorResult);
            li.appendChild(p);

            list.appendChild(li);

            const googlePromise = (async () => {
                try {
                    const content = await blobToBase64Async(blob);
                    const rects = await google.faceDetectionAsync(content, api.keys.google);
                    drawRects(rects, 'rgba(255, 0, 0, 0.75)', ctx);
                    if (rects.length > 0) {
                        googleResult.style.display = "inline";
                        googleCount++;
                        update(azureCount, googleCount, detectorCount);
                    }
                } catch (e) {
                    googleResult.innerText = "google: error";
                }
            })();

            const azurePromise = (async () => {
                try {
                    const rects = await azure.faceDetectionAsync(blob, api.keys.azure);
                    drawRects(rects, 'rgba(0, 0, 255, 0.75)', ctx);
                    if (rects.length > 0) {
                        azureResult.style.display = "inline";
                        azureCount++;
                        update(azureCount, googleCount, detectorCount);
                    }
                } catch (e) {
                    azureResult.innerText = "azure: error";
                }
            })();

            const detectorPromise = (async () => {
                try {
                    const rects = await detector.faceDetectionAsync(img);
                    drawRects(rects, 'rgba(0, 0, 0, 0.75)', ctx);
                    if (rects.length > 0) {
                        detectorResult.style.display = "inline";
                        detectorCount++;
                        update(azureCount, googleCount, detectorCount);
                    }
                } catch (e) {
                    detectorResult.innerText = "detector: error";
                }
            })();

            await Promise.all([googlePromise, azurePromise, detectorPromise]);
        }
    } catch (e) {
        alert(e);
    }
}

run();

export = 0;
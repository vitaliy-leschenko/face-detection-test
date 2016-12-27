import sources from "./image-sources";
import loadBlobAsync from "./libs/load-blob";
import loadImageAsync from "./libs/load-image";
import blobToBase64Async from "./libs/blob-to-base64";
import blobToBufferAsync from "./libs/blob-to-buffer";

import * as R from "./face-detection/rect";
import * as azure from "./face-detection/azure";
import * as google from "./face-detection/google";
import * as amazon from "./face-detection/amazon";
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

class Results {
    public count = 0;
    public time = 0;

    constructor(private id: string) {
    }

    public update(total: number): void {
        document.getElementById(this.id).innerText = `images: ${this.count} from ${total}, time: ${this.time}`;
    }
}

function setAzureResults(count: number, total: number, time: number): void {
    document.getElementById("azureResults").innerText = `images: ${count} from ${total}, time: ${time}`;
}

function setGoogleResults(count: number, total: number, time: number): void {
    document.getElementById("googleResults").innerText = `images: ${count} from ${total}, time: ${time}`;
}

function setAmazonResults(count: number, total: number, time: number): void {
    document.getElementById("amazonResults").innerText = `images: ${count} from ${total}, time: ${time}`;
}

async function run(): Promise<void> {
    const list = document.getElementById("list") as HTMLUListElement;

    const azureResults = new Results("azureResults");
    const googleResults = new Results("googleResults");
    const amazonResults = new Results("amazonResults");

    try {
        let total = 0;

        for (let src of sources()) {
            total++;

            const blob = await loadBlobAsync(src);
            const img = await loadImageAsync(src);

            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 200;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            const googleResult = document.createElement("span");
            const azureResult = document.createElement("span");
            const amazonResult = document.createElement("span");
            googleResult.innerText = "google";
            googleResult.style.color = "red";
            googleResult.style.display = "none";
            azureResult.innerText = "azure";
            azureResult.style.color = "blue";
            azureResult.style.display = "none";
            amazonResult.innerText = "amazon";
            amazonResult.style.color = "green";
            amazonResult.style.display = "none";

            const li = document.createElement("li");
            li.appendChild(canvas);
            const p = document.createElement("p");
            p.appendChild(googleResult);
            p.appendChild(azureResult);
            p.appendChild(amazonResult);
            li.appendChild(p);

            list.appendChild(li);

            const googlePromise = (async (index: number) => {
                try {
                    const start = performance.now();

                    const content = await blobToBase64Async(blob);
                    const rects = await google.faceDetectionAsync(content, api.keys.google);

                    const end = performance.now();

                    googleResults.time += end - start;

                    drawRects(rects, 'rgba(255, 0, 0, 0.75)', ctx);
                    if (rects.length > 0) {
                        googleResult.style.display = "inline";
                        googleResults.count++;
                    }
                    googleResults.update(index);
                } catch (e) {
                    googleResult.style.display = "inline";
                    googleResult.innerText = "google: error";
                }
            })(total);

            const azurePromise = (async (index: number) => {
                try {
                    const start = performance.now();

                    const rects = await azure.faceDetectionAsync(blob, api.keys.azure);

                    const end = performance.now();

                    azureResults.time += end - start;

                    drawRects(rects, 'rgba(0, 0, 255, 0.75)', ctx);
                    if (rects.length > 0) {
                        azureResult.style.display = "inline";
                        azureResults.count++;
                    }
                    azureResults.update(index);
                } catch (e) {
                    azureResult.style.display = "inline";
                    azureResult.innerText = "azure: error";
                }
            })(total);

            const amazonPromise = (async (index: number) => {
                try {
                    const start = performance.now();

                    const content = await blobToBufferAsync(blob);
                    const rects = await amazon.faceDetectionAsync(img.width, img.height, content, api.keys.amazon);

                    const end = performance.now();
                    amazonResults.time += end - start;

                    drawRects(rects, 'rgba(0, 255, 0, 0.75)', ctx);
                    if (rects.length > 0) {
                        amazonResult.style.display = "inline";
                        amazonResults.count++;
                    }
                    amazonResults.update(index);
                } catch (e) {
                    amazonResult.style.display = "inline";
                    amazonResult.innerText = "amazon: error";
                }
            })(total);

            await Promise.all([googlePromise, azurePromise, amazonPromise]);
        }
    } catch (e) {
        alert(e);
    }
}

run();

export = 0;
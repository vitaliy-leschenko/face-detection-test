import sources from "./image-sources";
import loadBlobAsync from "./libs/load-blob";
import loadImageAsync from "./libs/load-image";
import blobToBase64Async from "./libs/blob-to-base64";
import blobToBufferAsync from "./libs/blob-to-buffer";

import * as R from "./face-detection/rect";
import * as azure from "./face-detection/azure";
import * as google from "./face-detection/google";
import * as amazon from "./face-detection/amazon";
import * as amazonProxy from "./face-detection/amazon-proxy";
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

async function run(): Promise<void> {
    const list = document.getElementById("list") as HTMLUListElement;

    const azureResults = new Results("azureResults");
    const googleResults = new Results("googleResults");
    const amazonResults = new Results("amazonResults");
    const amazonProxyResults = new Results("amazonProxyResults");

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
            const amazonProxyResult = document.createElement("span");
            googleResult.innerText = "google";
            googleResult.style.color = "red";
            googleResult.style.display = "none";
            azureResult.innerText = "azure";
            azureResult.style.color = "blue";
            azureResult.style.display = "none";
            amazonResult.innerText = "amazon";
            amazonResult.style.color = "green";
            amazonResult.style.display = "none";
            amazonProxyResult.innerText = "amazon-proxy";
            amazonProxyResult.style.color = "green";
            amazonProxyResult.style.display = "none";

            const li = document.createElement("li");
            li.appendChild(canvas);
            const p = document.createElement("p");
            p.appendChild(googleResult);
            p.appendChild(azureResult);
            p.appendChild(amazonResult);
            li.appendChild(p);

            list.appendChild(li);

            const wait = async (index: number, span: HTMLSpanElement, results: Results, color: string, action: () => Promise<R.IRectangle[]>) => {
                try {
                    const start = performance.now();
                    const rects = await action();
                    const end = performance.now();
                    results.time += end - start;

                    color && drawRects(rects, color, ctx);
                    if (rects.length > 0) {
                        span.style.display = "inline";
                        results.count++;
                    }
                    results.update(index);
                } catch (e) {
                    span.style.display = "inline";
                    span.innerText = "error";
                }
            }

            await wait(total, azureResult, azureResults, 'rgba(0, 0, 255, 0.75)', async () => {
                return await azure.faceDetectionAsync(blob, api.keys.azure);
            });

            await wait(total, googleResult, googleResults, 'rgba(255, 0, 0, 0.75)', async () => {
                const content = await blobToBase64Async(blob);
                return await google.faceDetectionAsync(content, api.keys.google);
            });

            await wait(total, amazonResult, amazonResults, 'rgba(0, 255, 0, 0.75)', async () => {
                const content = await blobToBufferAsync(blob);
                return await amazon.faceDetectionAsync(img.width, img.height, content, api.keys.amazon);
            });

            await wait(total, amazonProxyResult, amazonProxyResults, null, async () => {
                const content = await blobToBase64Async(blob);
                return await amazonProxy.faceDetectionAsync(img.width, img.height, content);
            });
        }
    } catch (e) {
        alert(e);
    }
}

run();

export = 0;
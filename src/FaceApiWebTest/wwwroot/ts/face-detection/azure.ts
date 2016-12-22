import * as R from "./rect";

export function faceDetectionAsync(blob: Blob, apiKey: string): Promise<R.IRectangle[]> {
    return new Promise<R.IRectangle[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.projectoxford.ai/face/v1.0/detect?returnFaceId=false", true);
        xhr.setRequestHeader("Content-type", "application/octet-stream");
        xhr.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
        xhr.responseType = 'json';
        xhr.onload = e => {
            if (xhr.status === 200) {
                const output: R.IRectangle[] = [];
                let responses = xhr.response;
                if (typeof responses === "string") {
                    responses = JSON.parse(responses);
                }
                for (let response of responses) {
                    output.push(response.faceRectangle);
                }
                resolve(output);
            } else {
                reject("error");
            }
        };

        xhr.send(blob);
    });
}

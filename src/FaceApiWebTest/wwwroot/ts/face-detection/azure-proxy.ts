import * as R from "./rect";

export function faceDetectionAsync(content: string): Promise<R.IRectangle[]> {
    return new Promise<R.IRectangle[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/azure/face-detect", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.responseType = 'json';
        xhr.onload = e => {
            if (xhr.status === 200) {
                const output: R.IRectangle[] = [];
                let responses = xhr.response;
                if (typeof responses === "string") {
                    responses = JSON.parse(responses);
                }
                resolve(responses);
            } else {
                reject("error");
            }
        };
        xhr.onerror = e => reject(e);
        xhr.send(JSON.stringify({ data: content }));
    });
}

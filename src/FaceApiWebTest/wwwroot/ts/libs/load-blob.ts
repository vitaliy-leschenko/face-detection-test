export default function loadBlobAsync(url: string): Promise<Blob> {
    return new Promise<Blob>((resolve: (Blob) => void, reject: (reason?: any) => void) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = 'blob';
        xhr.onerror = e => {
            reject(e.message);
        }
        xhr.onload = e => {
            if (xhr.status === 200) {
                const blob = xhr.response;
                resolve(blob);
            } else {
                reject("invalid status");
            }
        }

        xhr.send();
    });
}
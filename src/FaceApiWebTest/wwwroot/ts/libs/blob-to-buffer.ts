export default function blobToBufferAsync(blob: Blob): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const buffer: ArrayBuffer = reader.result;
            resolve(buffer);
        }
        reader.onerror = e => reject(e);
        reader.readAsArrayBuffer(blob);
    });
}

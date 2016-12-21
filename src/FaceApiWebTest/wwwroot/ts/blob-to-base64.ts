export default function blobToBase64Async(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataURL: string = reader.result;
            const header = "data:" + blob.type + ";base64,";

            resolve(dataURL.substring(header.length));
        }
        reader.onerror = e => reject(e);
        reader.readAsDataURL(blob);
    });
}

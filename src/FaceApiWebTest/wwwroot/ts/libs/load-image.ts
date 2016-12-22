export default function loadImageAsync(url: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        var img = new Image();
        img.onload = e => resolve(img);
        img.onerror = e => reject(e);
        img.src = url;
    });
}
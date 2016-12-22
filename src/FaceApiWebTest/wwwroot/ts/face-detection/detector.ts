import Detector from "./detector/detector";
import { frontalface } from "./detector/detector.frontalface";

import * as R from "./rect";

export function faceDetectionAsync(img: HTMLImageElement): Promise<R.IRectangle[]> {
    const detector = new Detector(img.width, img.height, 1.2, frontalface, false);
    const rects: R.IRectangle[] = detector.detect(img, 1, 3).filter(t => t[4] > 1).map(t => {
        return {
            left: t[0],
            top: t[1],
            width: t[2],
            height: t[3]
        };
    });
    return Promise.resolve(rects);
}
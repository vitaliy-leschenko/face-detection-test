/**
 * Converts from a 4-channel RGBA source image to a 1-channel grayscale
 * image. Corresponds to the CV_RGB2GRAY OpenCV color space conversion.
 * 
 * @param {Array} src   4-channel 8-bit source image
 * @param {Array} [dst] 1-channel 32-bit destination image
 * 
 * @return {Array} 1-channel 32-bit destination image
 */
function convertRgbaToGrayscale(src: Uint32Array, dst?: Uint32Array): Uint32Array {
    const srcLength = src.length;
    if (!dst) dst = new Uint32Array(srcLength >> 2);

    for (let i = 0; i < srcLength; i += 4) {
        dst[i >> 2] = (src[i] * 4899 + src[i + 1] * 9617 + src[i + 2] * 1868 + 8192) >> 14;
    }
    return dst;
}

/**
 * Reduces the size of a given image by the given factor. Does NOT 
 * perform interpolation. If interpolation is required, prefer using
 * the drawImage() method of the <canvas> element.
 * 
 * @param {Array}  src       1-channel source image
 * @param {Number} srcWidth	 Width of the source image
 * @param {Number} srcHeight Height of the source image
 * @param {Number} factor    Scaling down factor (> 1.0)
 * @param {Array}  [dst]     1-channel destination image
 * 
 * @return {Array} 1-channel destination image
 */
function rescaleImage(src: Uint32Array, srcWidth: number, srcHeight: number, factor: number, dst?: Uint32Array): Uint32Array {
    var srcLength = srcHeight * srcWidth,
        dstWidth = ~~(srcWidth / factor),
        dstHeight = ~~(srcHeight / factor);

    if (!dst) dst = new Uint32Array(dstWidth * srcHeight);

    for (var x = 0; x < dstWidth; ++x) {
        var dstIndex = x;
        for (var srcIndex = ~~(x * factor), srcEnd = srcIndex + srcLength; srcIndex < srcEnd; srcIndex += srcWidth) {
            dst[dstIndex] = src[srcIndex];
            dstIndex += dstWidth;
        }
    }

    var dstIndex = 0;
    for (var y = 0, yEnd = dstHeight * factor; y < yEnd; y += factor) {
        for (var srcIndex = ~~(y) * dstWidth, srcEnd = srcIndex + dstWidth; srcIndex < srcEnd; ++srcIndex) {
            dst[dstIndex] = dst[srcIndex];
            ++dstIndex;
        }
    }
    return dst;
}

/**
 * Horizontally mirrors a 1-channel source image.
 * 
 * @param {Array}  src       1-channel source image
 * @param {Number} srcWidth  Width of the source image
 * @param {Number} srcHeight Height of the source image
 * @param {Array} [dst]      1-channel destination image
 * 
 * @return {Array} 1-channel destination image
 */
function mirrorImage(src: Uint32Array, srcWidth: number, srcHeight: number, dst?: Uint32Array): Uint32Array {
    if (!dst) dst = new Uint32Array(src.length);

    var index = 0;
    for (var y = 0; y < srcHeight; ++y) {
        for (var x = (srcWidth >> 1); x >= 0; --x) {
            var swap = src[index + x];
            dst[index + x] = src[index + srcWidth - 1 - x];
            dst[index + srcWidth - 1 - x] = swap;
        }
        index += srcWidth;
    }
    return dst;
}

/**
 * Computes the gradient magnitude using a sobel filter after
 * applying gaussian smoothing (5x5 filter size). Useful for canny
 * pruning.
 * 
 * @param {Array}  src      1-channel source image
 * @param {Number} srcWidth Width of the source image
 * @param {Number} srcWidth Height of the source image
 * @param {Array}  [dst]    1-channel destination image
 * 
 * @return {Array} 1-channel destination image
 */
function computeCanny(src: Uint32Array, srcWidth: number, srcHeight: number, dst?: Uint32Array): Uint32Array {
    const srcLength = src.length;
    if (!dst) dst = new Uint32Array(srcLength);
    const buffer1 = dst === src ? new Uint32Array(srcLength) : dst;
    const buffer2 = new Uint32Array(srcLength);

    // Gaussian filter with size=5, sigma=sqrt(2) horizontal pass:
    for (let x = 2; x < srcWidth - 2; ++x) {
        let index = x;
        for (let y = 0; y < srcHeight; ++y) {
            buffer1[index] =
                0.1117 * src[index - 2] +
                0.2365 * src[index - 1] +
                0.3036 * src[index] +
                0.2365 * src[index + 1] +
                0.1117 * src[index + 2];
            index += srcWidth;
        }
    }

    // Gaussian filter with size=5, sigma=sqrt(2) vertical pass:
    for (let x = 0; x < srcWidth; ++x) {
        let index = x + srcWidth;
        for (let y = 2; y < srcHeight - 2; ++y) {
            index += srcWidth;
            buffer2[index] =
                0.1117 * buffer1[index - srcWidth - srcWidth] +
                0.2365 * buffer1[index - srcWidth] +
                0.3036 * buffer1[index] +
                0.2365 * buffer1[index + srcWidth] +
                0.1117 * buffer1[index + srcWidth + srcWidth];
        }
    }

    // Compute gradient:
    const abs = Math.abs;
    for (let x = 2; x < srcWidth - 2; ++x) {
        let index = x + srcWidth;
        for (let y = 2; y < srcHeight - 2; ++y) {
            index += srcWidth;

            dst[index] =
                abs(-     buffer2[index - 1 - srcWidth]
                    + buffer2[index + 1 - srcWidth]
                    - 2 * buffer2[index - 1]
                    + 2 * buffer2[index + 1]
                    - buffer2[index - 1 + srcWidth]
                    + buffer2[index + 1 + srcWidth]) +

                abs(buffer2[index - 1 - srcWidth]
                    + 2 * buffer2[index - srcWidth]
                    + buffer2[index + 1 - srcWidth]
                    - buffer2[index - 1 + srcWidth]
                    - 2 * buffer2[index + srcWidth]
                    - buffer2[index + 1 + srcWidth]);
        }
    }
    return dst;
}

/**
 * Computes the integral image of a 1-channel image. Arithmetic
 * overflow may occur if the integral exceeds the limits for the
 * destination image values ([0, 2^32-1] for an unsigned 32-bit image).
 * The integral image is 1 pixel wider both in vertical and horizontal
 * dimension compared to the source image.
 * 
 * SAT = Summed Area Table.
 * 
 * @param {Array}       src       1-channel source image
 * @param {Number}      srcWidth  Width of the source image
 * @param {Number}      srcHeight Height of the source image
 * @param {Uint32Array} [dst]     1-channel destination image
 * 
 * @return {Uint32Array} 1-channel destination image
 */
function computeSat(src: Uint32Array, srcWidth: number, srcHeight: number, dst?: Uint32Array): Uint32Array {
    const dstWidth = srcWidth + 1;

    if (!dst) dst = new Uint32Array(srcWidth * srcHeight + dstWidth + srcHeight);

    for (let i = srcHeight * dstWidth; i >= 0; i -= dstWidth)
        dst[i] = 0;

    for (let x = 1; x <= srcWidth; ++x) {
        let column_sum = 0;
        let index = x;
        dst[x] = 0;

        for (var y = 1; y <= srcHeight; ++y) {
            column_sum += src[index - y];
            index += dstWidth;
            dst[index] = dst[index - 1] + column_sum;
        }
    }
    return dst;
}

/**
 * Computes the squared integral image of a 1-channel image.
 * @see computeSat()
 * 
 * @param {Array}       src       1-channel source image
 * @param {Number}      srcWidth  Width of the source image
 * @param {Number}      srcHeight Height of the source image
 * @param {Uint32Array} [dst]     1-channel destination image
 * 
 * @return {Uint32Array} 1-channel destination image
 */
function computeSquaredSat(src: Uint32Array, srcWidth: number, srcHeight: number, dst?: Uint32Array): Uint32Array {
    const dstWidth = srcWidth + 1;

    if (!dst) dst = new Uint32Array(srcWidth * srcHeight + dstWidth + srcHeight);

    for (let i = srcHeight * dstWidth; i >= 0; i -= dstWidth)
        dst[i] = 0;

    for (let x = 1; x <= srcWidth; ++x) {
        let column_sum = 0;
        let index = x;
        dst[x] = 0;
        for (let y = 1; y <= srcHeight; ++y) {
            let val = src[index - y];
            column_sum += val * val;
            index += dstWidth;
            dst[index] = dst[index - 1] + column_sum;
        }
    }
    return dst;
}

/**
 * Computes the rotated / tilted integral image of a 1-channel image.
 * @see computeSat()
 * 
 * @param {Array}       src       1-channel source image
 * @param {Number}      srcWidth  Width of the source image
 * @param {Number}      srcHeight Height of the source image
 * @param {Uint32Array} [dst]     1-channel destination image
 * 
 * @return {Uint32Array} 1-channel destination image
 */
function computeRsat(src: Uint32Array, srcWidth: number, srcHeight: number, dst?: Uint32Array): Uint32Array {
    let dstWidth = srcWidth + 1,
        srcHeightTimesDstWidth = srcHeight * dstWidth;

    if (!dst) dst = new Uint32Array(srcWidth * srcHeight + dstWidth + srcHeight);

    for (let i = srcHeightTimesDstWidth; i >= 0; i -= dstWidth)
        dst[i] = 0;

    for (let i = dstWidth - 1; i >= 0; --i)
        dst[i] = 0;

    let index = 0;
    for (let y = 0; y < srcHeight; ++y) {
        for (let x = 0; x < srcWidth; ++x) {
            dst[index + dstWidth + 1] = src[index - y] + dst[index];
            ++index;
        }
        dst[index + dstWidth] += dst[index];
        index++;
    }

    for (let x = srcWidth - 1; x > 0; --x) {
        let index = x + srcHeightTimesDstWidth;
        for (let y = srcHeight; y > 0; --y) {
            index -= dstWidth;
            dst[index + dstWidth] += dst[index] + dst[index + 1];
        }
    }

    return dst;
}

/**
 * Equalizes the histogram of an unsigned 1-channel image with integer 
 * values in [0, 255]. Corresponds to the equalizeHist OpenCV function.
 * 
 * @param {Array}  src   1-channel integer source image
 * @param {Number} step  Sampling stepsize, increase for performance
 * @param {Array}  [dst] 1-channel destination image
 * 
 * @return {Array} 1-channel destination image
 */
function equalizeHistogram(src: Uint32Array, step: number, dst?: Uint32Array): Uint32Array {
    const srcLength = src.length;
    if (!dst) dst = src;
    if (!step) step = 5;

    // Compute histogram and histogram sum:
    let hist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0];

    for (let i = 0; i < srcLength; i += step) {
        ++hist[src[i]];
    }

    // Compute integral histogram:
    let norm = 255 * step / srcLength,
        prev = 0;
    for (let i = 0; i < 256; ++i) {
        let h = hist[i];
        prev = h += prev;
        hist[i] = h * norm; // For non-integer src: ~~(h * norm + 0.5);
    }

    // Equalize image:
    for (let i = 0; i < srcLength; ++i) {
        dst[i] = hist[src[i]];
    }
    return dst;
}

/**
 * Horizontally mirrors a cascase classifier. Useful to detect mirrored
 * objects such as opposite hands.
 * 
 * @param {Array} dst Cascade classifier
 * 
 * @return {Array} Mirrored cascade classifier
 */
function mirrorClassifier(src: Float32Array, dst?: Float32Array): Float32Array {
    if (!dst) dst = new Float32Array(src);
    let windowWidth = src[0];

    for (let i = 1, iEnd = src.length - 1; i < iEnd;) {
        ++i;
        for (let j = 0, jEnd = src[++i]; j < jEnd; ++j) {
            if (src[++i]) {
                // Simple classifier is tilted:
                for (let kEnd = i + src[++i] * 5; i < kEnd;) {
                    dst[i + 1] = windowWidth - src[i + 1];
                    const width = src[i + 3];
                    dst[i + 3] = src[i + 4];
                    dst[i + 4] = width;
                    i += 5;
                }
            } else {
                // Simple classifier is not tilted:
                for (let kEnd = i + src[++i] * 5; i < kEnd;) {
                    dst[i + 1] = windowWidth - src[i + 1] - src[i + 3];
                    i += 5;
                }
            }
            i += 3;
        }
    }
    return dst;
}

/**
 * Compiles a cascade classifier to be applicable to images
 * of given dimensions. Speeds-up the actual detection process later on.
 * 
 * @param {Array}        src    Cascade classifier
 * @param {Number}       width  Width of the source image
 * @param {Number}       height Height of the source image
 * 
 * @return {Float32Array} Compiled cascade classifier
 */
function compileClassifier(src: Float32Array, width: number, height: number): Float32Array {
    width += 1;
    height += 1;
    var dst = new Float32Array(src.length);
    var dstUint32 = new Uint32Array(dst.buffer);

    dstUint32[0] = src[0];
    dstUint32[1] = src[1];
    var dstIndex = 1;
    for (var srcIndex = 1, iEnd = src.length - 1; srcIndex < iEnd;) {
        dst[++dstIndex] = src[++srcIndex];

        var numComplexClassifiers = dstUint32[++dstIndex] = src[++srcIndex];
        for (var j = 0, jEnd = numComplexClassifiers; j < jEnd; ++j) {

            var tilted = dst[++dstIndex] = src[++srcIndex];
            var numFeaturesTimes2 = dstUint32[++dstIndex] = src[++srcIndex] * 3;
            if (tilted) {
                for (var kEnd = dstIndex + numFeaturesTimes2; dstIndex < kEnd;) {
                    var featureOffset = src[srcIndex + 1] + src[srcIndex + 2] * width,
                        featureWidthTimesWidth = src[srcIndex + 3] * (width + 1),
                        featureHeightTimesWidth = src[srcIndex + 4] * (width - 1);

                    dstUint32[++dstIndex] = featureOffset;
                    dstUint32[++dstIndex] = featureWidthTimesWidth + (featureHeightTimesWidth << 16);

                    dst[++dstIndex] = src[srcIndex + 5];
                    srcIndex += 5;
                }
            } else {
                for (var kEnd = dstIndex + numFeaturesTimes2; dstIndex < kEnd;) {
                    var featureOffset = src[srcIndex + 1] + src[srcIndex + 2] * width,
                        featureWidth = src[srcIndex + 3],
                        featureHeightTimesWidth = src[srcIndex + 4] * width;

                    dstUint32[++dstIndex] = featureOffset;
                    dstUint32[++dstIndex] = featureWidth + (featureHeightTimesWidth << 16);
                    dst[++dstIndex] = src[srcIndex + 5];
                    srcIndex += 5;
                }
            }
            var classifierThreshold = src[++srcIndex];
            for (var k = 0; k < numFeaturesTimes2;) {
                dst[dstIndex - k] /= classifierThreshold;
                k += 3;
            }

            if ((classifierThreshold < 0)) {
                dst[dstIndex + 2] = src[++srcIndex];
                dst[dstIndex + 1] = src[++srcIndex];
                dstIndex += 2;
            } else {
                dst[++dstIndex] = src[++srcIndex];
                dst[++dstIndex] = src[++srcIndex];
            }
        }
    }
    return dst.subarray(0, dstIndex + 1);
}

/**
 * Evaluates a compiled cascade classifier. Sliding window approach.
 * 
 * @param {Uint32Array}  sat        SAT of the source image
 * @param {Uint32Array}  rsat       Rotated SAT of the source image
 * @param {Uint32Array}  ssat       Squared SAT of the source image
 * @param {Uint32Array}  [cannySat] SAT of the canny source image
 * @param {Number}       width      Width of the source image
 * @param {Number}       height     Height of the source image
 * @param {Number}       step       Stepsize, increase for performance
 * @param {Float32Array} classifier Compiled cascade classifier
 * 
 * @return {Array} Rectangles representing detected objects
 */
function detect(sat: Uint32Array, rsat: Uint32Array, ssat: Uint32Array, cannySat: Uint32Array, width: number, height: number, step: number, classifier: Float32Array): [number,number,number,number][] {
    width += 1;
    height += 1;

    let classifierUint32 = new Uint32Array(classifier.buffer),
        windowWidth = classifierUint32[0],
        windowHeight = classifierUint32[1],
        windowHeightTimesWidth = windowHeight * width,
        area = windowWidth * windowHeight,
        inverseArea = 1 / area,
        widthTimesStep = width * step,
        rects: [number, number, number, number][] = [];

    for (var x = 0; x + windowWidth < width; x += step) {
        var satIndex = x;
        for (var y = 0; y + windowHeight < height; y += step) {
            var satIndex1 = satIndex + windowWidth,
                satIndex2 = satIndex + windowHeightTimesWidth,
                satIndex3 = satIndex2 + windowWidth,
                canny = false;

            // Canny test:
            if (cannySat) {
                var edgesDensity = (cannySat[satIndex] -
                    cannySat[satIndex1] -
                    cannySat[satIndex2] +
                    cannySat[satIndex3]) * inverseArea;
                if (edgesDensity < 60 || edgesDensity > 200) {
                    canny = true;
                    satIndex += widthTimesStep;
                    continue;
                }
            }

            // Normalize mean and variance of window area:
            var mean = (sat[satIndex] -
                sat[satIndex1] -
                sat[satIndex2] +
                sat[satIndex3]),

                variance = (ssat[satIndex] -
                    ssat[satIndex1] -
                    ssat[satIndex2] +
                    ssat[satIndex3]) * area - mean * mean,

                std = variance > 1 ? Math.sqrt(variance) : 1,
                found = true;

            // Evaluate cascade classifier aka 'stages':
            for (var i = 1, iEnd = classifier.length - 1; i < iEnd;) {
                var complexClassifierThreshold = classifier[++i];
                // Evaluate complex classifiers aka 'trees':
                var complexClassifierSum = 0;
                for (var j = 0, jEnd = classifierUint32[++i]; j < jEnd; ++j) {

                    // Evaluate simple classifiers aka 'nodes':
                    var simpleClassifierSum = 0;

                    if (classifierUint32[++i]) {
                        // Simple classifier is tilted:
                        for (var kEnd = i + classifierUint32[++i]; i < kEnd;) {
                            var f1 = satIndex + classifierUint32[++i],
                                packed = classifierUint32[++i],
                                f2 = f1 + (packed & 0xFFFF),
                                f3 = f1 + (packed >> 16 & 0xFFFF);

                            simpleClassifierSum += classifier[++i] *
                                (rsat[f1] - rsat[f2] - rsat[f3] + rsat[f2 + f3 - f1]);
                        }
                    } else {
                        // Simple classifier is not tilted:
                        for (var kEnd = i + classifierUint32[++i]; i < kEnd;) {
                            var f1 = satIndex + classifierUint32[++i],
                                packed = classifierUint32[++i],
                                f2 = f1 + (packed & 0xFFFF),
                                f3 = f1 + (packed >> 16 & 0xFFFF);

                            simpleClassifierSum += classifier[++i] *
                                (sat[f1] - sat[f2] - sat[f3] + sat[f2 + f3 - f1]);
                        }
                    }
                    complexClassifierSum += classifier[i + (simpleClassifierSum > std ? 2 : 1)];
                    i += 2;
                }
                if (complexClassifierSum < complexClassifierThreshold) {
                    found = false;
                    break;
                }
            }
            if (found) rects.push([x, y, windowWidth, windowHeight]);
            satIndex += widthTimesStep;
        }
    }
    return rects;
}

/**
 * Groups rectangles together using a rectilinear distance metric. For
 * each group of related rectangles, a representative mean rectangle
 * is returned.
 * 
 * @param {Array}  rects        Rectangles (Arrays of 4 floats)
 * @param {Number} minNeighbors
 *  
 * @return {Array} Mean rectangles (Arrays of 4 floats)
 */
function groupRectangles(rects: [number, number, number, number][], minNeighbors: number, confluence?: number): [number, number, number, number, number][] {
    var rectsLength = rects.length;
    if (!confluence) confluence = 1.0;

    // Partition rects into similarity classes:
    var numClasses = 0;
    var labels = new Array(rectsLength);
    for (var i = 0; i < labels.length; ++i) {
        labels[i] = 0;
    }

    for (var i = 0; i < rectsLength; ++i) {
        var found = false;
        for (var j = 0; j < i; ++j) {

            // Determine similarity:
            var rect1 = rects[i];
            var rect2 = rects[j];
            var delta = confluence * (Math.min(rect1[2], rect2[2]) + Math.min(rect1[3], rect2[3]));
            if (Math.abs(rect1[0] - rect2[0]) <= delta &&
                Math.abs(rect1[1] - rect2[1]) <= delta &&
                Math.abs(rect1[0] + rect1[2] - rect2[0] - rect2[2]) <= delta &&
                Math.abs(rect1[1] + rect1[3] - rect2[1] - rect2[3]) <= delta) {

                labels[i] = labels[j];
                found = true;
                break;
            }
        }
        if (!found) {
            labels[i] = numClasses++;
        }
    }

    // Compute average rectangle (group) for each cluster:
    var groups = new Array(numClasses);

    for (var i = 0; i < numClasses; ++i) {
        groups[i] = [0, 0, 0, 0, 0];
    }

    for (var i = 0; i < rectsLength; ++i) {
        var rect = rects[i],
            group = groups[labels[i]];
        group[0] += rect[0];
        group[1] += rect[1];
        group[2] += rect[2];
        group[3] += rect[3];
        ++group[4];
    }

    for (var i = numClasses - 1; i >= 0; --i) {
        var numNeighbors = groups[i][4];
        if (numNeighbors >= minNeighbors) {
            var group = groups[i];
            group[0] /= numNeighbors;
            group[1] /= numNeighbors;
            group[2] /= numNeighbors;
            group[3] /= numNeighbors;
        } else groups.splice(i, 1);
    }

    // Filter out small rectangles inside larger rectangles:
    var filteredGroups: [number, number, number, number, number][] = [];
    for (var i = 0; i < numClasses; ++i) {
        var r1 = groups[i];

        for (var j = 0; j < numClasses; ++j) {
            if (i === j) continue;
            var r2 = groups[j];
            var dx = r2[2] * 0.2;
            var dy = r2[3] * 0.2;

            if (r1[0] >= r2[0] - dx &&
                r1[1] >= r2[1] - dy &&
                r1[0] + r1[2] <= r2[0] + r2[2] + dx &&
                r1[1] + r1[3] <= r2[1] + r2[3] + dy) {
                break;
            }
        }

        if (j === numClasses) {
            filteredGroups.push(r1);
        }
    }
    return filteredGroups;
}


export default class Detector {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private tilted: boolean;
    private scaleFactor: number;
    private numScales: number;
    private scaledGray: Uint32Array;
    private compiledClassifiers: any[];
    private gray: Uint32Array = null;
    private sat: Uint32Array = null;
    private ssat: Uint32Array=  null;
    private rsat: Uint32Array = null;

    constructor(width: number, height: number, scaleFactor: number, classifier: Float32Array, tilted: boolean) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext('2d');
        this.tilted = tilted;
        this.scaleFactor = scaleFactor;
        this.numScales = ~~(Math.log(Math.min(width / classifier[0], height / classifier[1])) / Math.log(scaleFactor));
        this.scaledGray = new Uint32Array(width * height);
        this.compiledClassifiers = [];
        var scale = 1;
        for (var i = 0; i < this.numScales; ++i) {
            var scaledWidth = ~~(width / scale);
            var scaledHeight = ~~(height / scale);
            this.compiledClassifiers[i] = compileClassifier(classifier, scaledWidth, scaledHeight);
            scale *= scaleFactor;
        }
    }

    public detect(image: HTMLImageElement | HTMLCanvasElement, group: number, stepSize: number = 1): [number, number, number, number][] {
        var width = this.canvas.width;
        var height = this.canvas.height;

        this.context.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
        var imageData = this.context.getImageData(0, 0, width, height).data;
        this.gray = convertRgbaToGrayscale(imageData);

        let rects: [number, number, number, number][] = [];
        var scale = 1;
        for (var i = 0; i < this.numScales; ++i) {
            var scaledWidth = ~~(width / scale);
            var scaledHeight = ~~(height / scale);

            if (scale == 1) {
                this.scaledGray.set(this.gray);
            } else {
                this.scaledGray = rescaleImage(this.gray, width, height, scale, this.scaledGray);
            }

            this.sat = computeSat(this.scaledGray, scaledWidth, scaledHeight, this.sat);
            this.ssat = computeSquaredSat(this.scaledGray, scaledWidth, scaledHeight, this.ssat);
            if (this.tilted) this.rsat = computeRsat(this.scaledGray, scaledWidth, scaledHeight, this.rsat);

            var newRects = detect(this.sat, this.rsat, this.ssat, undefined, scaledWidth, scaledHeight, stepSize, this.compiledClassifiers[i]);
            for (var j = newRects.length - 1; j >= 0; --j) {
                newRects[j][0] *= width / scaledWidth;
                newRects[j][1] *= height / scaledHeight;
                newRects[j][2] *= width / scaledWidth;
                newRects[j][3] *= height / scaledHeight;
            }
            rects = rects.concat(newRects);

            scale *= this.scaleFactor;
        }
        return group ? groupRectangles(rects, group).sort(function (r1, r2) { return r2[4] - r1[4]; }) : rects;
    }
}

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
define("amazon", ["require", "exports"], function (require, exports) {
    "use strict";
    console.log("amazon");
    return 0;
});
define("image-sources", ["require", "exports"], function (require, exports) {
    "use strict";
    function sources() {
        var list = [];
        for (let t = 1; t <= 58; t++) {
            let id = t.toString();
            while (id.length < 5)
                id = "0" + id;
            list.push(`/images/image${id}.jpg`);
        }
        return list;
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = sources;
});
define("load-blob", ["require", "exports"], function (require, exports) {
    "use strict";
    function loadBlobAsync(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = 'blob';
            xhr.onerror = e => {
                reject(e.message);
            };
            xhr.onload = e => {
                if (xhr.status === 200) {
                    const blob = xhr.response;
                    resolve(blob);
                }
                else {
                    reject("invalid status");
                }
            };
            xhr.send();
        });
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = loadBlobAsync;
});
define("load-image", ["require", "exports"], function (require, exports) {
    "use strict";
    function loadImageAsync(url) {
        return new Promise((resolve, reject) => {
            var img = new Image();
            img.onload = e => resolve(img);
            img.onerror = e => reject(e);
            img.src = url;
        });
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = loadImageAsync;
});
define("azure", ["require", "exports", "image-sources", "load-blob", "load-image"], function (require, exports, image_sources_1, load_blob_1, load_image_1) {
    "use strict";
    function faceDetectionAsync(blob) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "https://api.projectoxford.ai/face/v1.0/detect?returnFaceId=true", true);
            xhr.setRequestHeader("Content-type", "application/octet-stream");
            xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "8d6d5f781e8e4d58befa313ce445d123");
            xhr.responseType = 'json';
            xhr.onload = e => {
                if (xhr.status === 200) {
                    resolve(xhr.response);
                }
                else {
                    reject("error");
                }
            };
            xhr.send(blob);
        });
    }
    function run() {
        return __awaiter(this, void 0, void 0, function* () {
            const list = document.getElementById("list");
            try {
                let detected = 0;
                let total = 0;
                for (let src of image_sources_1.default()) {
                    const blob = yield load_blob_1.default(src);
                    const img = yield load_image_1.default(src);
                    const result = yield faceDetectionAsync(blob);
                    const li = document.createElement("li");
                    const canvas = document.createElement("canvas");
                    canvas.width = 300;
                    canvas.height = 200;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    for (let face of result) {
                        const rect = face.faceRectangle;
                        ctx.beginPath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
                        ctx.rect(rect.left, rect.top, rect.width, rect.height);
                        ctx.stroke();
                    }
                    li.appendChild(canvas);
                    const p = document.createElement("p");
                    if (result.length > 0) {
                        p.style.fontWeight = "bold";
                        p.innerText = "detected";
                    }
                    else {
                        p.innerText = "no faces";
                    }
                    li.appendChild(p);
                    list.appendChild(li);
                    total++;
                    if (result.length > 0)
                        detected++;
                }
                const li = document.createElement("li");
                const p = document.createElement("p");
                p.innerText = `result: ${detected} / ${total}`;
                li.appendChild(p);
                list.appendChild(li);
            }
            catch (e) {
                const li = document.createElement("li");
                const p = document.createElement("p");
                p.innerText = e;
                li.appendChild(p);
                list.appendChild(li);
            }
        });
    }
    run();
    return 0;
});
define("blob-to-base64", ["require", "exports"], function (require, exports) {
    "use strict";
    function blobToBase64Async(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataURL = reader.result;
                const header = "data:" + blob.type + ";base64,";
                resolve(dataURL.substring(header.length));
            };
            reader.onerror = e => reject(e);
            reader.readAsDataURL(blob);
        });
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = blobToBase64Async;
});
define("google", ["require", "exports", "image-sources", "load-blob", "load-image", "blob-to-base64"], function (require, exports, image_sources_2, load_blob_2, load_image_2, blob_to_base64_1) {
    "use strict";
    function faceDetectionAsync(content) {
        const authKey = "AIzaSyCt42CUKRGguaDQIOwKZaP6s_mWkeYYrQU";
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "https://vision.googleapis.com/v1/images:annotate?key=" + authKey, true);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.responseType = 'json';
            xhr.onload = e => {
                if (xhr.status === 200) {
                    resolve(xhr.response.responses[0].faceAnnotations || []);
                }
                else {
                    reject("error");
                }
            };
            const requests = {
                requests: [
                    {
                        image: {
                            content: content
                        },
                        features: [{
                                type: "FACE_DETECTION",
                                maxResults: 5
                            }]
                    }
                ]
            };
            xhr.send(JSON.stringify(requests));
        });
    }
    function run() {
        return __awaiter(this, void 0, void 0, function* () {
            const list = document.getElementById("list");
            try {
                let detected = 0;
                let total = 0;
                for (let src of image_sources_2.default()) {
                    const blob = yield load_blob_2.default(src);
                    const img = yield load_image_2.default(src);
                    const content = yield blob_to_base64_1.default(blob);
                    const result = yield faceDetectionAsync(content);
                    const li = document.createElement("li");
                    const canvas = document.createElement("canvas");
                    canvas.width = 300;
                    canvas.height = 200;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    for (let face of result) {
                        const vertices = face.boundingPoly.vertices;
                        ctx.beginPath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
                        ctx.moveTo(vertices[0].x || 0, vertices[0].y || 0);
                        for (let t = 1; t < vertices.length; t++) {
                            ctx.lineTo(vertices[t].x || 0, vertices[t].y || 0);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    }
                    li.appendChild(canvas);
                    const p = document.createElement("p");
                    if (result.length > 0) {
                        p.style.fontWeight = "bold";
                        p.innerText = "detected";
                    }
                    else {
                        p.innerText = "no faces";
                    }
                    li.appendChild(p);
                    list.appendChild(li);
                    total++;
                    if (result.length > 0)
                        detected++;
                }
                const li = document.createElement("li");
                const p = document.createElement("p");
                p.innerText = `result: ${detected} / ${total}`;
                li.appendChild(p);
                list.appendChild(li);
            }
            catch (e) {
                const li = document.createElement("li");
                const p = document.createElement("p");
                p.innerText = e;
                li.appendChild(p);
                list.appendChild(li);
            }
        });
    }
    run();
    return 0;
});
//# sourceMappingURL=app.js.map
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
        for (var t = 1; t <= 58; t++) {
            var id = t.toString();
            while (id.length < 5)
                id = "0" + id;
            list.push("/images/image" + id + ".jpg");
        }
        return list;
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = sources;
});
define("load-blob", ["require", "exports"], function (require, exports) {
    "use strict";
    function loadBlobAsync(url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = 'blob';
            xhr.onerror = function (e) {
                reject(e.message);
            };
            xhr.onload = function (e) {
                if (xhr.status === 200) {
                    var blob = xhr.response;
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
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function (e) { return resolve(img); };
            img.onerror = function (e) { return reject(e); };
            img.src = url;
        });
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = loadImageAsync;
});
define("azure", ["require", "exports", "image-sources", "load-blob", "load-image"], function (require, exports, image_sources_1, load_blob_1, load_image_1) {
    "use strict";
    function faceDetectionAsync(blob) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "https://api.projectoxford.ai/face/v1.0/detect?returnFaceId=true", true);
            xhr.setRequestHeader("Content-type", "application/octet-stream");
            xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "8d6d5f781e8e4d58befa313ce445d123");
            xhr.responseType = 'json';
            xhr.onload = function (e) {
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
        return __awaiter(this, void 0, void 0, function () {
            var list, detected, total, _i, _a, src, blob, img, result, li_1, canvas, ctx, _b, result_1, face, rect, p_1, li, p, e_1, li, p;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        list = document.getElementById("list");
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 8, , 9]);
                        detected = 0;
                        total = 0;
                        _i = 0, _a = image_sources_1.default();
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length))
                            return [3 /*break*/, 7];
                        src = _a[_i];
                        return [4 /*yield*/, load_blob_1.default(src)];
                    case 3:
                        blob = _c.sent();
                        return [4 /*yield*/, load_image_1.default(src)];
                    case 4:
                        img = _c.sent();
                        return [4 /*yield*/, faceDetectionAsync(blob)];
                    case 5:
                        result = _c.sent();
                        li_1 = document.createElement("li");
                        canvas = document.createElement("canvas");
                        canvas.width = 300;
                        canvas.height = 200;
                        ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);
                        for (_b = 0, result_1 = result; _b < result_1.length; _b++) {
                            face = result_1[_b];
                            rect = face.faceRectangle;
                            ctx.beginPath();
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
                            ctx.rect(rect.left, rect.top, rect.width, rect.height);
                            ctx.stroke();
                        }
                        li_1.appendChild(canvas);
                        p_1 = document.createElement("p");
                        if (result.length > 0) {
                            p_1.style.fontWeight = "bold";
                            p_1.innerText = "detected";
                        }
                        else {
                            p_1.innerText = "no faces";
                        }
                        li_1.appendChild(p_1);
                        list.appendChild(li_1);
                        total++;
                        if (result.length > 0)
                            detected++;
                        _c.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        li = document.createElement("li");
                        p = document.createElement("p");
                        p.innerText = "result: " + detected + " / " + total;
                        li.appendChild(p);
                        list.appendChild(li);
                        return [3 /*break*/, 9];
                    case 8:
                        e_1 = _c.sent();
                        li = document.createElement("li");
                        p = document.createElement("p");
                        p.innerText = e_1;
                        li.appendChild(p);
                        list.appendChild(li);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    run();
    return 0;
});
define("blob-to-base64", ["require", "exports"], function (require, exports) {
    "use strict";
    function blobToBase64Async(blob) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onloadend = function () {
                var dataURL = reader.result;
                var header = "data:" + blob.type + ";base64,";
                resolve(dataURL.substring(header.length));
            };
            reader.onerror = function (e) { return reject(e); };
            reader.readAsDataURL(blob);
        });
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = blobToBase64Async;
});
define("google", ["require", "exports", "image-sources", "load-blob", "load-image", "blob-to-base64"], function (require, exports, image_sources_2, load_blob_2, load_image_2, blob_to_base64_1) {
    "use strict";
    function faceDetectionAsync(content) {
        var authKey = "AIzaSyCt42CUKRGguaDQIOwKZaP6s_mWkeYYrQU";
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "https://vision.googleapis.com/v1/images:annotate?key=" + authKey, true);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.responseType = 'json';
            xhr.onload = function (e) {
                if (xhr.status === 200) {
                    resolve(xhr.response.responses[0].faceAnnotations || []);
                }
                else {
                    reject("error");
                }
            };
            xhr.send(JSON.stringify({
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
            }));
        });
    }
    function run() {
        return __awaiter(this, void 0, void 0, function () {
            var list, detected, total, _i, _a, src, blob, img, content, result, li_2, canvas, ctx, _b, result_2, face, vertices, t, p_2, li, p, e_2, li, p;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        list = document.getElementById("list");
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 9, , 10]);
                        detected = 0;
                        total = 0;
                        _i = 0, _a = image_sources_2.default();
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length))
                            return [3 /*break*/, 8];
                        src = _a[_i];
                        return [4 /*yield*/, load_blob_2.default(src)];
                    case 3:
                        blob = _c.sent();
                        return [4 /*yield*/, load_image_2.default(src)];
                    case 4:
                        img = _c.sent();
                        return [4 /*yield*/, blob_to_base64_1.default(blob)];
                    case 5:
                        content = _c.sent();
                        return [4 /*yield*/, faceDetectionAsync(content)];
                    case 6:
                        result = _c.sent();
                        li_2 = document.createElement("li");
                        canvas = document.createElement("canvas");
                        canvas.width = 300;
                        canvas.height = 200;
                        ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);
                        for (_b = 0, result_2 = result; _b < result_2.length; _b++) {
                            face = result_2[_b];
                            vertices = face.boundingPoly.vertices;
                            ctx.beginPath();
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
                            ctx.moveTo(vertices[0].x || 0, vertices[0].y || 0);
                            for (t = 1; t < vertices.length; t++) {
                                ctx.lineTo(vertices[t].x || 0, vertices[t].y || 0);
                            }
                            ctx.closePath();
                            ctx.stroke();
                        }
                        li_2.appendChild(canvas);
                        p_2 = document.createElement("p");
                        if (result.length > 0) {
                            p_2.style.fontWeight = "bold";
                            p_2.innerText = "detected";
                        }
                        else {
                            p_2.innerText = "no faces";
                        }
                        li_2.appendChild(p_2);
                        list.appendChild(li_2);
                        total++;
                        if (result.length > 0)
                            detected++;
                        _c.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8:
                        li = document.createElement("li");
                        p = document.createElement("p");
                        p.innerText = "result: " + detected + " / " + total;
                        li.appendChild(p);
                        list.appendChild(li);
                        return [3 /*break*/, 10];
                    case 9:
                        e_2 = _c.sent();
                        li = document.createElement("li");
                        p = document.createElement("p");
                        p.innerText = e_2;
                        li.appendChild(p);
                        list.appendChild(li);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    }
    run();
    return 0;
});
//# sourceMappingURL=app.js.map
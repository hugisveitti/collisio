"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printMemoryInfo = exports.byteToGig = void 0;
var si = __importStar(require("systeminformation"));
si.cpu()
    .then(function (data) {
    console.log("####CPU Info#####");
    console.log("cores", data.cores);
    console.log("#####END CPU INFO#####");
})
    .catch(function (error) { return console.error(error); });
var byteToGig = function (byte) {
    return byte / (Math.pow(1024, 3));
};
exports.byteToGig = byteToGig;
var printMemoryInfo = function () {
    si.mem()
        .then(function (data) {
        console.log("#### Memory Info #####", new Date().toISOString());
        console.log("Total", (0, exports.byteToGig)(data.total).toFixed(2), ", Free:", (0, exports.byteToGig)(data.free).toFixed(2));
        console.log("##### END Memory INFO #####");
    })
        .catch(function (error) { return console.error(error); });
};
exports.printMemoryInfo = printMemoryInfo;

"use strict";
exports.__esModule = true;
var utilFunctions_1 = require("../utils/utilFunctions");
test('remove one undefined', function () {
    var object = {
        a: 1,
        b: undefined
    };
    expect((0, utilFunctions_1.removeUndefinedFromObject)(object)).toBe({ a: 1 });
});
test('remove no undefined', function () {
    var object = {
        a: 1
    };
    expect((0, utilFunctions_1.removeUndefinedFromObject)(object)).toBe({ a: 1 });
});

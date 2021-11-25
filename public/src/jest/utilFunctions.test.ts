import { removeUndefinedFromObject } from "../utils/utilFunctions"

test('remove one undefined', () => {
    const object = {
        a: 1,
        b: undefined
    }

    expect(removeUndefinedFromObject(object)).toBe({ a: 1 });
});

test('remove no undefined', () => {
    const object = {
        a: 1,
    }

    expect(removeUndefinedFromObject(object)).toBe({ a: 1 });
});

export { }
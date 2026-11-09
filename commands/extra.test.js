const assert = require('assert');
const { parseCurrencyInput, isValidIPv4, parseUnitInput } = require('./extra');

assert.deepStrictEqual(parseCurrencyInput('100 USD to KES'), { amount: '100', from: 'USD', to: 'KES' });
assert.deepStrictEqual(parseCurrencyInput('12.50 eur GBP'), { amount: '12.50', from: 'EUR', to: 'GBP' });
assert.strictEqual(parseCurrencyInput('100 USD'), null);

assert.strictEqual(isValidIPv4('192.168.1.1'), true);
assert.strictEqual(isValidIPv4('255.255.255.255'), true);
assert.strictEqual(isValidIPv4('256.1.1.1'), false);
assert.strictEqual(isValidIPv4('192.168.1'), false);
assert.strictEqual(isValidIPv4('abc.def.ghi.jkl'), false);

assert.deepStrictEqual(parseUnitInput('10 km to mi'), { value: 10, from: 'km', to: 'mi' });
assert.deepStrictEqual(parseUnitInput('-2.5 kg lb'), { value: -2.5, from: 'kg', to: 'lb' });
assert.strictEqual(parseUnitInput('10 kilometers to miles'), null);

console.log('Extra command input tests passed.');

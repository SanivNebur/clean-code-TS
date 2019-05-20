import * as fs from 'fs';
import { Assert } from "./assert";
import * as mocks from "./mocks";

beforeAll(() => {
  mocks.cleanShoopingCart();
});

describe(`As a customer, I want to save and restore my current shopping cart, so I can continue later`,()=>{
    let assert:Assert;

    assert = {
        given: 'a shopping cart',
        should:'save it',
      };
    test(`given ${assert.given} should ${assert.should}`, () => {
      const shoppingCart = mocks.newShoppingCart;
      shoppingCart.addProduct('computer', 1000, 1, shoppingCart.country);
      shoppingCart.save();
      assert.actual=  fs.existsSync(mocks.shoppingCartFilePath);
      assert.expected= true;
      expect(assert.actual).toEqual(assert.expected);
    });

    assert = {
      given: 'a saved shopping cart',
      should:'restore it',
    };
  test(`given ${assert.given} should ${assert.should}`, () => {
    const shoppingCart = mocks.newShoppingCart;
    shoppingCart.read();
    assert.actual=  shoppingCart.items.length;
    assert.expected= 1;
    expect(assert.actual).toEqual(assert.expected);
  });
})



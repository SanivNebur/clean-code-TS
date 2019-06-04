import { COUNTRY_CONFIGURATIONS } from '../database/config/country-configurations';
import { PAYMENTS_CONFIGURATIONS } from '../database/config/payments-configurations';
import { CountryConfiguration } from '../models/country-configuration';
import { PaymentConfiguration } from '../models/payment-configuration';
import { ShippingCost } from '../models/shipping-cost';
import { ShoppingCart } from '../models/shopping-cart';
import { Checker } from '../tools/checker';

export interface ICalculateCheckOut {
  calculateShippingCosts() : void;
  applyPaymentMethodExtra( payment : string ) : void;
  applyDiscount() : void;
}

export class CalculateCheckOutFactory {
  public static createCalculatorFor( shoppingCart : ShoppingCart ) : ICalculateCheckOut {
    return new CheckOutCalculator( shoppingCart );
  }
}

export class CheckOutCalculator implements ICalculateCheckOut {
  private readonly countryConfigurations : CountryConfiguration[] = COUNTRY_CONFIGURATIONS;
  private readonly paymentsConfigurations : PaymentConfiguration[] = PAYMENTS_CONFIGURATIONS;
  private readonly discountFactor = 0.9;
  private readonly checker = new Checker();

  constructor( private readonly shoppingCart : ShoppingCart ) { }

  public calculateShippingCosts() {
    const countryConfiguration = this.getCountryConfiguration();
    countryConfiguration.shippingCost.forEach( ( shippingCost : ShippingCost ) => {
      if ( this.hasShippingCost( shippingCost ) ) {
        const shippingCostAmount = this.shoppingCart.legalAmounts.total * shippingCost.factor + shippingCost.plus;
        this.shoppingCart.legalAmounts.total += shippingCostAmount;
        return;
      }
    } );
  }

  public applyPaymentMethodExtra( payment : string ) {
    const paymentConfiguration : PaymentConfiguration = this.getPaymentConfiguration( payment );
    this.shoppingCart.legalAmounts.total = this.shoppingCart.legalAmounts.total * paymentConfiguration.extraFactor;
  }

  public applyDiscount() {
    if ( this.hasDiscount() ) {
      this.shoppingCart.legalAmounts.total *= this.discountFactor;
    }
  }

  private hasShippingCost( shippingCost : ShippingCost ) {
    return this.shoppingCart.legalAmounts.total < shippingCost.upTo;
  }

  private hasDiscount() {
    return this.shoppingCart.client.isVip || this.hasCountryDiscount();
  }

  private hasCountryDiscount() {
    const countryConfiguration = this.getCountryConfiguration();
    return this.shoppingCart.legalAmounts.total > countryConfiguration.thresholdForDiscount;
  }

  private getCountryConfiguration() {
    return this.checker.findSafe(
      this.countryConfigurations,
      countryConfiguration => countryConfiguration.countryName === this.shoppingCart.client.country
    );
  }
  private getPaymentConfiguration( payment : string ) {
    return this.checker.findSafe(
      this.paymentsConfigurations,
      paymentConfiguration => paymentConfiguration.paymentMethod === payment
    );
  }
}

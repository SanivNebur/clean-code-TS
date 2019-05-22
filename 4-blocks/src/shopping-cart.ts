import * as fs from 'fs';
import * as path from 'path';
import { DocumentManager } from './document-manager';
import { TaxCalculator } from './tax-calculator';
import { WarehouseAdministrator } from './warehouse-administrator';

export class ShoppingCart {
  public lineItems : any[] = [];
  public totalAmount : number = 0;
  public shippingCost = 0;
  public taxesAmount : number = 0;
  public paymentMethod : string = '';
  public paymentId : string = '';
  public shippingAddress : string = '';
  public billingAddress : string = '';
  public invoiceNumber : number = 0;
  public documentManager = new DocumentManager();

  constructor(
    public clientName : string,
    private isStudent : boolean,
    public region : string,
    public country : string,
    public email : string,
    private isVip : boolean,
    public taxNumber? : string
  ) { }

  public addLineItem(
    productName : string,
    price : number,
    quantity : number,
    country? : string,
    taxFree? : boolean
  ) {
    this.lineItems.push( { productName, price, quantity } );
  }

  public removeLineItem( productName : string ) {
    this.lineItems = this.lineItems.filter( lineItem => lineItem.productName !== productName );
  }

  public saveToStorage() {
    if ( !fs.existsSync( path.join( __dirname, '..', 'data' ) ) ) {
      fs.mkdirSync( path.join( __dirname, '..', 'data' ) );
    }
    const shoppingFileName = `shopping-${this.clientName}.json`;
    const fileName = path.join( path.join( __dirname, '..', 'data' ), shoppingFileName );
    if ( !fs.existsSync( fileName ) ) {
      fs.writeFileSync( fileName, JSON.stringify( this.lineItems ) );
    }
  }

  public loadFromStorage() {
    const shoppingFileName = `shopping-${this.clientName}.json`;
    const fileName = path.join( path.join( __dirname, '..', 'data' ), shoppingFileName );
    if ( fs.existsSync( fileName ) ) {
      const file = fs.readFileSync( fileName, 'utf8' );
      this.lineItems = JSON.parse( file );
    }
  }

  public deleteFromStorage() {
    const shoppingFileName = `shopping-${this.clientName}.json`;
    const fileName = path.join( path.join( __dirname, '..', 'data' ), shoppingFileName );
    if ( fs.existsSync( fileName ) ) {
      fs.unlinkSync( fileName );
    }
  }

  public calculate(
    paymentMethod : string,
    paymentId : string,
    shippingAddress : string,
    billingAddress? : string
  ) {
    this.shippingAddress = shippingAddress;
    this.billingAddress = billingAddress || shippingAddress;
    this.paymentMethod = paymentMethod;
    this.paymentId = paymentId;

    this.calculateTotalAmount();

    this.calculateShippingCosts();

    this.applyPaymentMethodExtra( paymentMethod );

    this.applyDiscount();

    this.taxesAmount += TaxCalculator.calculateTotal(
      this.totalAmount,
      this.country,
      this.region,
      this.isStudent
    );

    this.setInvoiceNumber();
    const orderMessage = this.documentManager.getOrderMessage( this );
    this.documentManager.emailOrder( this, orderMessage, this.country );
    this.deleteFromStorage();
  }

  private setInvoiceNumber() {
    const invoiceNumberFileName = path.join(
      path.join( __dirname, '..', 'data' ),
      `lastinvoice.txt`
    );
    let lastInvoiceNumber = 0;
    if ( fs.existsSync( invoiceNumberFileName ) ) {
      try {
        const savedInvoiceNumber = fs.readFileSync( invoiceNumberFileName, 'utf8' );
        lastInvoiceNumber = Number.parseInt( savedInvoiceNumber );
      } catch ( error ) { }
    }
    this.invoiceNumber = lastInvoiceNumber + 1;
    fs.writeFileSync( invoiceNumberFileName, this.invoiceNumber );
  }

  private applyPaymentMethodExtra( payment : string ) {
    if ( payment === 'PayPal' ) {
      this.totalAmount = this.totalAmount * 1.05;
    }
  }

  private applyDiscount() {
    if (
      this.isVip ||
      ( this.totalAmount > 3000 && this.country === 'Portugal' ) ||
      ( this.totalAmount > 2000 && this.country === 'France' ) ||
      ( this.totalAmount > 1000 && this.country === 'Spain' )
    ) {
      this.totalAmount *= 0.9;
    }
  }

  private calculateShippingCosts() {
    if ( this.totalAmount < 100 ) {
      this.calculateShippingSmallOrders();
    } else if ( this.totalAmount < 1000 ) {
      this.calculateShippingMediumOrders();
    } else {
      this.calculateShippingBigOrders();
    }
    this.totalAmount += this.shippingCost;
  }

  private calculateShippingSmallOrders() {
    switch ( this.country ) {
      case 'Spain':
        this.shippingCost = this.totalAmount * 0.1;
        break;
      case 'Portugal':
        this.shippingCost = this.totalAmount * 0.15;
        break;
      case 'France':
        this.shippingCost = this.totalAmount * 0.2;
        break;
      default:
        this.shippingCost = this.totalAmount * 0.25;
        break;
    }
  }

  private calculateShippingMediumOrders() {
    switch ( this.country ) {
      case 'Spain':
        this.shippingCost = 10;
        break;
      case 'Portugal':
        this.shippingCost = 15;
        break;
      case 'France':
        this.shippingCost = 20;
        break;
      default:
        this.shippingCost = 25;
        break;
    }
  }

  private calculateShippingBigOrders() {
    switch ( this.country ) {
      case 'Spain':
        this.shippingCost = 0;
        break;
      case 'Portugal':
        this.shippingCost = 10;
        break;
      case 'France':
        this.shippingCost = 15;
        break;
      default:
        this.shippingCost = 20;
        break;
    }
  }

  private calculateTotalAmount() {
    const warehouseAdministrator = new WarehouseAdministrator();
    this.lineItems.forEach( line => {
      warehouseAdministrator.updateBuyedProduct( line.productName, line.quantity );
      line.totalAmount = line.price * line.quantity;
      this.totalAmount += line.totalAmount;
      this.addTaxesByProduct( line );
    } );
  }

  private addTaxesByProduct( line : any ) {
    if ( !line.taxFree ) {
      line.taxes = TaxCalculator.calculateLine( line, this.country, this.region, this.isStudent );
      this.taxesAmount += line.taxes;
      let lineTotal = line.totalAmount + line.taxes;
    }
  }

  public sendInvoiceToCustomer() {
    this.documentManager.sendInvoice( this );
  }
}
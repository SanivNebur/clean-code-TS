import * as fs from 'fs';
import * as path from 'path';
import { ShoppingCart } from '../src/shoppingcart';

export const newShoppingCart =
     new ShoppingCart('Alberto', false, 'Galicia', 'Spain', 'alberto@code.dev', true, 'A12345678');


export const shoopingCart = {
    clientName:"Alberto",student:false,region:"Galicia",country:"Spain",email:"alberto@code.dev",isVip:true,
    taxNumber:"A12345678",items:[],totalAmount:0,shipping_cost:0,taxes:0,
    payment:"",paymentId:"",shippingAddress:"",billingAddress:"",invoiceNumber:0,"doc":{}
}

export const shoppingCartFilePath =
    path.join(__dirname, '..' , 'src/data', `shooping-${shoopingCart.clientName}.json`);


    export function cleanShoopingCart(){
        if (fs.existsSync(shoppingCartFilePath)) {
            rimraf(shoppingCartFilePath);
          }
    }

    export function cleanCheckOuts(){
    const emailFolder= path.join(__dirname, '..' , 'src/data' , 'email');
    rimraf(emailFolder);
    const printFolder= path.join(__dirname, '..' , 'src/data' , 'print');
    rimraf(printFolder);
}


function rimraf(dir_path:string) {
    console.log('deleting: '+ dir_path);
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}
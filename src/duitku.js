"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
// import crypto from 'crypto'
const crypto = require('crypto');
var PaymentType;
(function (PaymentType) {
    PaymentType["VC"] = "VC";
    PaymentType["BK"] = "BK";
    PaymentType["M1"] = "M1";
    PaymentType["BT"] = "BT";
    PaymentType["A1"] = "A1";
    PaymentType["B1"] = "B1";
    PaymentType["I1"] = "I1";
    PaymentType["VA"] = "VA";
    PaymentType["FT"] = "FT";
    PaymentType["OV"] = "OV";
    PaymentType["DN"] = "DN";
    PaymentType["SP"] = "SP";
})(PaymentType = exports.PaymentType || (exports.PaymentType = {}));
class Duitku {
    constructor({ merchantCode, merchantKey }, options = { timeout: 7000, production: false }) {
        this.DEV_HOSTNAME = 'sandbox.duitku.com';
        this.PROD_HOSTNAME = 'passport.duitku.com';
        this.REQUEST_TRANSCATION_URL = '/webapi/api/merchant/v2/inquiry';
        this.CHECK_TRANSACTION_URL = '/webapi/api/merchant/transactionStatus';
        this.credentials = { merchantCode, merchantKey };
        this.duitkuOptions = options;
    }
    calculateSignature(orderId, amount) {
        return crypto.createHash('md5').update(`${this.credentials.merchantCode}${orderId}${amount.toString()}${this.credentials.merchantKey}`.toUpperCase()).digest("hex").toLowerCase();
    }
    requestTransaction({ paymentAmount, merchantOrderId, productDetails, email, additionalParam, paymentMethod, merchantUserInfo, customerVaName, phoneNumber, itemDetails, customerDetail, returnUrl, callbackUrl, signature, expiryPeriod }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { timeout } = this.duitkuOptions;
                const url = `https://${this.duitkuOptions.production ? this.PROD_HOSTNAME : this.DEV_HOSTNAME}${this.REQUEST_TRANSCATION_URL}`;
                // const newSignature = this.calculateSignature(merchantOrederId, paymentAmount.toString())
                // console.log('signature', signature)
                let body = {
                    merchantCode: this.credentials.merchantCode,
                    paymentAmount: paymentAmount,
                    paymentMethod: paymentMethod,
                    merchantOrderId: merchantOrderId,
                    productDetails: productDetails,
                    additionalParam: additionalParam,
                    merchantUserInfo: merchantUserInfo,
                    customerVaName: customerVaName,
                    email: email,
                    phoneNumber: phoneNumber,
                    itemDetails: itemDetails,
                    customerDetail: customerDetail,
                    callbackUrl: callbackUrl,
                    returnUrl: returnUrl,
                    signature: signature ? signature : this.calculateSignature(merchantOrderId, paymentAmount.toString()),
                    expiryPeriod: expiryPeriod,
                };
                const stringBody = JSON.stringify(body);
                const headers = { 'Content-Type': 'application/json', 'Content-Length': stringBody.length };
                let options = { method: 'POST', timeout, headers: headers };
                const response = yield node_fetch_1.default(url, Object.assign(Object.assign({}, options), { body: stringBody }));
                // console.log(await response.json())
                return yield response.json();
            }
            catch (e) {
                throw new Error(e);
            }
        });
    }
    checkTransaction({ merchantOrderId, signature }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { timeout } = this.duitkuOptions;
                const url = `https://${this.duitkuOptions.production ? this.PROD_HOSTNAME : this.DEV_HOSTNAME}${this.REQUEST_TRANSCATION_URL}`;
                let body = {
                    merchantCode: this.credentials.merchantCode,
                    merchantOrderId: merchantOrderId,
                    signature: signature ? signature : this.calculateSignature(merchantOrderId, ''),
                };
                const stringBody = JSON.stringify(body);
                const headers = { 'Content-Type': 'application/json', 'Content-Length': stringBody.length };
                let options = { method: 'POST', timeout, headers: headers };
                const response = yield node_fetch_1.default(url, Object.assign(Object.assign({}, options), { body: stringBody }));
                return yield response.json();
            }
            catch (e) {
                throw new Error(e);
            }
        });
    }
    validateCallback({ amount, merchantOrderId, signature }) {
        if (signature != this.calculateSignature(merchantOrderId, amount.toString()))
            return false;
        return true;
    }
    fixedVAInquiry({ action, merchantCode, bin, vaNo, session, signature }, controller) {
        return {};
    }
}
exports.default = Duitku;
//# sourceMappingURL=duitku.js.map
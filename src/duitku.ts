import fetch from 'node-fetch'
// import crypto from 'crypto'

const crypto = require('crypto')

export enum PaymentType{
	VC = 'VC', // Credit Card (Visa / Master)
	BK = 'BK', // BCA KlikPa
	M1 = 'M1', // Mandiri Virtual Account
	BT = 'BT', // Permata Bank Virtual Account
	A1 = 'A1', // ATM Bersama
	B1 = 'B1', // CIMB Niaga Virtual Account
	I1 = 'I1', // BNI Virtual Account
	VA = 'VA', // Maybank Virtual Account
	FT = 'FT', // Ritel
	OV = 'OV', // OVO
	DN = 'DN', // Indodana Paylater
	SP = 'SP', // Shopee Pay
}

export interface DuitkuCredential{
	merchantCode			: string,
	merchantKey				: string
}

export interface DuitkuOptions{
	timeout?					: number,
	ipWhitelist?			: string, 
	production?				: boolean
}

export interface ItemDetail{
	name							: string, // 50
	quantity					: number,
	price							: number
}

export interface Address{
	firstName?				: string, // 50
	lastName?					: string, // 50
	address?					: string, // 50
	city?							: string, // 50
	postalCode?				: string, // 50
	phone?						: string, // 50
	countryCode?			: string, // 50
}

export interface CustomerDetail{
	firstName?				: string, // 50
	lastName?					: string, //50
	email?						: string, // 50
	phoneNumber?			: string, // 50
	billingAddress?		: Address,
	shippingAddress?	: Address,
}

export interface RequestTransactionInput{
	paymentAmount			: number,
	merchantOrderId		: string, // 50
	productDetails		: string, // 255
	email							: string, // 255
	additionalParam?	: string, // 255
	paymentMethod			: PaymentType, // 2
	merchantUserInfo?	: string, // 255
	customerVaName		: string, // 20
	phoneNumber				: string, // 50
	itemDetails				: ItemDetail[],
	customerDetail?		: CustomerDetail,
	returnUrl					: string, // 255
	callbackUrl				: string, // 255
	signature?				: string, // 255
	expiryPeriod?			: number, 
}

export interface CallbackInput{
	merchantCode 			: string,
	amount						: number,
	merchantOrderId		: string,
	productDetail			: string,
	additionalParam		: string,
	paymentCode				: string,
	resultCode				: string,
	merchantUserId		: string,
	reference					: string,
	signature					: string,
}

export interface FixedVaInquiry{
	action						: string,
	merchantCode			: string,
	bin								: string,
	vaNo							: string,
	session						: string,
	signature					: string
}

interface IDuitku{

}

export default class Duitku implements IDuitku{
	private DEV_HOSTNAME = 'sandbox.duitku.com'
	private PROD_HOSTNAME = 'passport.duitku.com'

	private REQUEST_TRANSCATION_URL = '/webapi/api/merchant/v2/inquiry'
	private CHECK_TRANSACTION_URL = '/webapi/api/merchant/transactionStatus'

	private credentials: DuitkuCredential
	private duitkuOptions: DuitkuOptions

	constructor({merchantCode, merchantKey}: DuitkuCredential, options: DuitkuOptions = { timeout: 7000, production: false }){
		this.credentials 		= { merchantCode, merchantKey }
		this.duitkuOptions 	= options
	}

	public calculateSignature(orderId: string, amount: string): string{
		return crypto.createHash('md5').update(`${this.credentials.merchantCode}${orderId}${amount.toString()}${this.credentials.merchantKey}`.toUpperCase()).digest("hex").toLowerCase()
	}

	public async requestTransaction({ paymentAmount, merchantOrderId, productDetails, email, additionalParam, paymentMethod, merchantUserInfo, customerVaName, phoneNumber, itemDetails, customerDetail, returnUrl, callbackUrl, signature, expiryPeriod }: RequestTransactionInput): Promise<object>{
		try{
			const { timeout } = this.duitkuOptions
			const url = `https://${this.duitkuOptions.production ? this.PROD_HOSTNAME : this.DEV_HOSTNAME}${this.REQUEST_TRANSCATION_URL}`
			// const newSignature = this.calculateSignature(merchantOrederId, paymentAmount.toString())
			// console.log('signature', signature)
			let body = {
				merchantCode			: this.credentials.merchantCode, 
				paymentAmount			: paymentAmount,
				paymentMethod			: paymentMethod,
				merchantOrderId		: merchantOrderId,
				productDetails		: productDetails,
				additionalParam		: additionalParam, // OPTIONAL
				merchantUserInfo	: merchantUserInfo, // OPTIONAL
				customerVaName		: customerVaName,
				email							: email,
				phoneNumber				: phoneNumber,
				itemDetails				: itemDetails,
				customerDetail		: customerDetail, // OPTIONAL
				callbackUrl				: callbackUrl,
				returnUrl					: returnUrl,
				signature					: signature ? signature : this.calculateSignature(merchantOrderId, paymentAmount.toString()),
				expiryPeriod			: expiryPeriod,
			}
			const stringBody 	= JSON.stringify(body)
			const headers 		= { 'Content-Type': 'application/json', 'Content-Length': stringBody.length }
			let options 			= { method: 'POST', timeout, headers: headers }

			const response = await fetch( url, { ...options, body: stringBody })
			// console.log(await response.json())
			return await response.json()
		}catch(e){ throw new Error(e) }
	}

	public async checkTransaction({ merchantOrderId, signature }: RequestTransactionInput): Promise<object>{
		try{
			const { timeout } = this.duitkuOptions
			const url = `https://${this.duitkuOptions.production ? this.PROD_HOSTNAME : this.DEV_HOSTNAME}${this.REQUEST_TRANSCATION_URL}`
			let body = {
				merchantCode			: this.credentials.merchantCode, 
				merchantOrderId		: merchantOrderId,
				signature					: signature ? signature : this.calculateSignature(merchantOrderId, ''),
			}
			const stringBody 	= JSON.stringify(body)
			const headers 		= { 'Content-Type': 'application/json', 'Content-Length': stringBody.length }
			let options 			= { method: 'POST', timeout, headers: headers }

			const response = await fetch( url, { ...options, body: stringBody })
			return await response.json()
		}catch(e){ throw new Error(e) }
	}

	public validateCallback( { amount, merchantOrderId, signature }: CallbackInput): boolean{
		if(signature != this.calculateSignature(merchantOrderId, amount.toString())) return false
		return true
	}

	public fixedVAInquiry({ action, merchantCode, bin, vaNo, session, signature }: FixedVaInquiry, controller: Function): object{
		
		return {}
	}
}
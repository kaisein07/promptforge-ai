import { FedaPay, Transaction } from 'fedapay';

FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY!);
FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'sandbox');

export { FedaPay, Transaction };
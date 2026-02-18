const currency = 'usd';
const date_from = '20220707';
const date_to = '20220719';

const myUrl = new URL("https://bank.gov.ua/");
myUrl.pathname = "NBU_Exchange/exchange_site";

myUrl.searchParams.append("json", "");
myUrl.searchParams.append("start", date_from);
myUrl.searchParams.append("end", date_to);
myUrl.searchParams.append("valcode", currency);


console.log(myUrl.href);
import Rx from 'rxjs';
import Ml from './ml';
import flatten from 'flat';

const emailRe =/[\w.+-]+@[\w+-.]+/

function extractEmail(messages) {
  const emails = messages
    .map( message => message.text.plain )
    .filter( message => emailRe.test(message))
    .map( message => message.match(emailRe)[0] )
    .filter( email => !email.endsWith("@mail.mercadolibre.com") )
    .filter( email => email != 'nescaps@gmail.com' )
  ;
  return emails.length > 0 ? emails[emails.length-1] : 'N/A';
}

function getParams() {
  return {
    seller: document.getElementById('seller').value,
    token: document.getElementById('token').value,
    from: parseInt(document.getElementById('from').value),
    to: parseInt(document.getElementById('to').value),
    size: 50
  };
}

function headers(item) {
  return 'email,' + Object.keys(flatten(item, {safe: true})).join(',');
}

function toCsvLine(item) {
  return Object.keys(flatten(item, {safe: true}))
    .map( key => item[key] )
    .join(',');
}

function getOrdersCount() {

  const {seller, token} = getParams();

  const ml = new Ml(seller, token);

  ml.getOrdersCount().subscribe( 
    total => {
      const totalEl = document.getElementById('total');
      totalEl.innerHTML = total;
    },
    (err) => alert('fallo')
  );
  
}

function retrieveResults() {

  const results = document.getElementById('results');

  results.innerHTML = '';

  const {seller, token, from, to, size} = getParams();

  const ml = new Ml(seller, token);

  const stream = Rx.Observable
    .range(0, (to-from)/size)
    .map( page => [from+(page*size), size] )
    .flatMap( ([offset, limit]) => ml.getOrdersChunk(offset, limit))
    .flatMap( chunk => Rx.Observable.from(chunk))
    .flatMap( order => {
      const orderEmail = ml.getOrderComments(order.id)
        .map( extractEmail);
      return orderEmail.map( email => { 
        return {
          order: order.id,
          product: order.order_items[0].item.title,
          buyerNick: order.buyer.nickname,
          email: email
        };
      });
    })
    .map( toCsvLine )
  ;

  stream.subscribe(
    lines => {
      results.innerHTML += lines + '\n';
    }, 
    (err) => {
      console.log(err);
      alert("fallo");
    }, 
    () => alert("completado")
  );

  /*
  const headersEl = document.getElementById('headers');

  const header$ = ml.getOrdersChunk(0, 1)
    .map(arr => arr[0])
    .map(headers);

  header$.subscribe( 
    headers => {
      headersEl.innerHTML = headers;
    }
  );
  */
  
}


document.getElementById('getcount').onclick = getOrdersCount;
document.getElementById('retrieve').onclick = retrieveResults;

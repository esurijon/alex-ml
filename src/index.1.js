import Rx from 'rxjs';
import Ml from './ml';

function getParams() {
  return {
    seller: document.getElementById('seller').value,
    token: document.getElementById('token').value,
    from: parseInt(document.getElementById('from').value),
    to: parseInt(document.getElementById('to').value),
    size: 50
  };
}

function extractOrderInfo(order) {
  return {
    id: order.id,
    name: order.buyer.nickname
  };
}

function toCsvLine(item) {
  return Object.keys(item)
    .map( key => item[key] )
    .join(';');
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

  const {seller, token, from, to, size} = getParams();

  const ml = new Ml(seller, token);

  const emailRe =/[\w.+-]+@[\w+-.]+/

  Rx.Observable
    .range(0, (to-from)/size)
    .map( page => [from+(page*size), size] )

  const stream = Rx.Observable
    .range(0, (to-from)/size)
    .map( page => [from+(page*size), size] )
    .flatMap( ([offset, limit]) => ml.getOrdersChunk(offset, limit))
    .flatMap( chunk => Rx.Observable.from(chunk))
    .map( extractOrderInfo )
    .flatMap( orderInfo => { 
      const message$ = ml.getOrderComments(orderInfo.id);
      return message$.map( messages => [orderInfo, messages]);
    })
    .flatMap( ([orderInfo, messages]) => {
      const array = messages.map( message => Object.assign(orderInfo, {message: message.text.plain.replace('\n', ' ')}))
      return Rx.Observable.from(array);
    })
    .filter( item => emailRe.test(item.message))
    .map( item => Object.assign(item, {email: item.message.match(emailRe)[0]}) )
    .filter( item => !item.email.endsWith("@mail.mercadolibre.com") )
    .map( item => {
      delete item.message;
      return item;
    })
    .map( toCsvLine )
    .scan( (lines, line) => lines+'\n'+line, '')
  ;

  const results = document.getElementById('results');
  stream.subscribe(
    lines => {
      results.innerHTML = lines;
    }, 
    (err) => alert("fallo"), 
    () => alert("completado")
  );

}

document.getElementById('getcount').onclick = getOrdersCount;
document.getElementById('retrieve').onclick = retrieveResults;

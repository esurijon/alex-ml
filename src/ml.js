import Rx from 'rxjs';


var x = new Headers();
x.append("Access-Control-Allow-Origin", "*");

var opts = {
  headers: x,
  mode: 'cors',
  cache: 'default'
};

function Ml(seller, token) {

  const baseUrl = 'https://api.mercadolibre.com';

  this.getOrdersCount = function()  {
    const ordersUrl = `${baseUrl}/orders/search/archived?seller=${seller}&access_token=${token}&limit=1&offset=0`;
    const promise = fetch(ordersUrl, opts)
      .then(function(response) {
        if(response.ok) {
          return response.json();
        } else {
          throw new Error(response);
        }
      })
      .then(function(response) {
        return response.paging.total;
      });
    return Rx.Observable.fromPromise(promise);
  };
  
  
  this.getOrdersChunk = function(offset, limit)  {
    const ordersUrl = `${baseUrl}/orders/search/archived?seller=${seller}&access_token=${token}&limit=${limit}&offset=${offset}`;
    const promise = fetch(ordersUrl, opts)
      .then(function(response) {
        if(response.ok) {
          return response.json();
        } else {
          throw new Error(response);
        }
      })
      .then(function(response) {
        return response.results;
      });
    return Rx.Observable.fromPromise(promise);
  };
  
  this.getOrderComments = function(orderId)  {
    const orderCommentsUrl = `${baseUrl}/messages/orders/${orderId}?access_token=${token}`
    const promise = fetch(orderCommentsUrl, opts)
      .then(function(response) {
        if(response.ok) {
          return response.json();
        } else {
          throw new Error(response);
        }
      })
      .then(function(response) {
        return response.results;
      });
    return Rx.Observable.fromPromise(promise);
  };
  
}

export default Ml;
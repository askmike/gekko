import superagent from 'superagent'
import noCache from 'superagent-no-cache'

if(process.env.NODE_ENV === 'development') {
  var API_PATH = 'http://localhost:3000/api/';
} else {
  var API_PATH = '/api/';
}

const processResponse = next => (err, res) => {
  if(err)
    return next(err);

  if(!res.text)
    return next('no data');

  let data = JSON.parse(res.text);

  next(false, data);
}

export const post = (to, data, next) => {
  superagent
    .post(API_PATH + to)
    .use(noCache)
    .send(data)
    .end(processResponse(next));
}

export const get = (to, next) => {
  superagent
    .get(API_PATH + to)
    .use(noCache)
    .end(processResponse(next));
}
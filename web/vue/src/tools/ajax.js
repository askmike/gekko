import superagent from 'superagent'
import noCache from 'superagent-no-cache'
import { restPath } from './api.js'

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
    .post(restPath + to)
    .use(noCache)
    .send(data)
    .end(processResponse(next));
}

export const get = (to, next) => {
  superagent
    .get(restPath + to)
    .use(noCache)
    .end(processResponse(next));
}

module.exports = cb => {

  return {
    message: message => {

      if(message.type === 'update')
        cb(null, {
          done: false,
          latest: message.latest
        })

      else if(message.type === 'error') {
        cb(message.error);
        console.error(message.error);
      }

      else if(message.type === 'log')
        console.log(message.log);
    },
    exit: status => {
      if(status !== 0)
        return cb('Child process has died.');
      else
        cb(null, { done: true });
    }
  }
}
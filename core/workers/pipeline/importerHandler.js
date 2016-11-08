module.exports = cb => {

  return {
    message: message => {

      if(message.type === 'update')
        cb(null, {
          done: false,
          latest: message.latest
        })

      else if(message.type === 'log')
        console.log(message.log);
    },
    exit: status => {
      if(status !== 0)
        // todo: upstream error
        return cb(new Error('ERROR!'));

      cb(null, {
        done: true
      });
    }
  }
}
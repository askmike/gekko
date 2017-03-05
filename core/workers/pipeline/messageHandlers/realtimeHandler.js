// pass back all messages as is
// (except for errors and logs)

module.exports = cb => {

  return {
    message: message => {
      if(message.type === 'trade') {
        console.log(message)
      }
      if(message.type === 'report') {
        console.log(message)
      }

      if(message.type === 'error') {
        cb(message.error);
        console.error(message.error);
      }

      else if(message.type === 'log')
        console.log(message.log);

      else
        cb(null, message)

    },
    exit: status => {
      if(status !== 0)
        cb('Child process has died.');
      else
        cb(null, { done: true });
    }
  }
}
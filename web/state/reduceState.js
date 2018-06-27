// Redux inspired reducer, reduces an event into a gekko state.
// NOTE: this does mutate.
// NOTE2: this is used by the backend as well as the frontend.

const moment = require('moment');

const skipInitialEvents = ['marketUpdate'];
const skipLatestEvents = ['marketStart'];
const trackAllEvents = ['tradeCompleted', 'advice', 'roundtrip'];

const reduce = (state, event) => {
  const type = event.type;
  const payload = event.payload;

  state.latestUpdate = moment();

  if(trackAllEvents.includes(type)) {
    if(!state.events[type])
      state.events[type] = [];

    state.events[type].push(payload);
  }

  if(!state.events.initial[type] && !skipInitialEvents.includes(type)) {
    state.events.initial[type] = payload;
  }

  if(!skipLatestEvents.includes(type)) {
    state.events.latest[type] = payload;
  }

  return state;
}

module.exports = reduce;
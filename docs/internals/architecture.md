# Gekko's architecture

Gekko is build around an event based architecture. The core consists of different modules that pass data between each other. All internal events are exposed to plugins as well, some parts of core are even implemented as plugins (like the [trading advisor](https://github.com/askmike/gekko/blob/0.2/plugins/tradingAdvisor.js) and [the trader](https://github.com/askmike/gekko/blob/0.2/plugins/trader.js)).

This image below gives a represenation of how information is propogated inside Gekko.

![Gekko 0.1.0 architecture](http://data.wizb.it/misc/gekko-0.1.0-architecture.jpg)

--

Rest is coming soon!
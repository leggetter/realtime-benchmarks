# Realtime Benchmarks

Does some benchmarking of popular Realtime Hosted Services. You can see the current stats on the [Realtime Hosted Service Latency Stats page][latency-page].

The services that are currently benchmarked are:

* [Fanout](http://fanout.io)
* [Firebase](http://firebase.com)
* [Hydna](http://hydna.com)
* [PubNub](http://pubnub.com)
* [Pusher](http://pusher.com)
* [Realtime.co](http://realtime.co)

## client

The `client` directory contains the benchmarking code and some stuff required to build it (concat the files).

Within `src/public/js` you'll find `BenchmarkRunner.js`. This class runs the tests.

The `src/public/js/BenchmarkService.js` class is an abstract class that defines how each of the services should be benchmarked.

* Each of the classes that inherits from this must override the `send` and `disconnect` functions and act appropriately when they are called i.e. when `send` is called it should send the provided message.
* When the implementation is ready to be benchmarked it should call `onReady` on the provided listener.
* When the implementation receives a message back it is expected to call `onMessage` on a listener object that is provided to the constructor.
* If the implementation wants to log anything it can call `onLog` on the provided listener.
* Each implementation is given a channel name that it can send message on, if required.

### Testing and Developing New Benchmarks

A development server can be run using [foreman](http://ddollar.github.io/foreman/).

```
› cd client
› foreman start
07:56:44 web.1  | started with pid 14596
07:56:45 web.1  | [2014-11-15 07:56:45] INFO  WEBrick 1.3.1
07:56:45 web.1  | [2014-11-15 07:56:45] INFO  ruby 2.0.0 (2013-11-22) [x86_64-darwin13.0.0]
07:56:45 web.1  | == Sinatra/1.3.3 has taken the stage on 5000 for development with backup from WEBrick
07:56:45 web.1  | [2014-11-15 07:56:45] INFO  WEBrick::HTTPServer#start: pid=14596 port=5000
```

## report-server

Basic code required to provide some historical and realtime latency on the [Realtime Hosted Service Latency Stats page][latency-page].

This includes and endpoint for consuming new results and uses [Faye](http://faye.jcoglan.com) to deliver realtime updates to the latency stats page.

*It's a bit of a mess right now and needs some refactoring*

## results

Some code for fetching and analysing the results that have been captured since *Sun Oct 28 2012 12:52:01 GMT+0000 (GMT)*.

*Note: Calling the results endpoint will only return the last 10 results. If you'd like a copy of the raw data then please get in touch.*

## server

Code that is used to faciliate the benchmark tests and store the results.

[latency-page]: http://www.leggetter.co.uk/real-time-web-technologies-guide/realtime-hosted-service-latency

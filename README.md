##Marketing Grader Events:
A NodeJs Utility to collect events from MarketingGrader and automatically group them in hourly buckets.

The app comes in 2 parts:  
1.  Backend that collect events (overt HTTP) ,do the hourly grouping/counting, and saving to db.
2.  Frontend , to graphically display collected events.

## What is it good for?
In your applications you need to count occurence of certain events as the application run , 
for example number of 3rd part api calls your application make so you can measure your usage
for that api.

This application gives you an HTTP endpoint that you can call with any kinda of event that you want to count over time.

## How It Works?
The HTTP end point accepts a JSON holding all the details about the event that you want to count
, the application will hold events of similar type for short time (5 seconds default) , then flush them to the database and update tables counters.

The other part of the application (the front end) gives you a graphical display that you
can watch , monitor your counters.

## How Data Is Saved?
The data get saved (currently) in a single MySQL table , structured as below
<code>
  hour int(11) NOT NULL,
  day int(11) NOT NULL,
  month int(11) NOT NULL,
  year int(11) NOT NULL,
  family varchar(255) NOT NULL,
  event varchar(255) NOT NULL,
  date date NOT NULL,
  count int(11) DEFAULT NULL,
  details longblob,
</code>
The events needed to be counted get stored per hour level , all events get occured in the same hour , are counted together to filled "count" field , and all comments sent with each tracked
event get aggregated inthe "details" field.

## Installation
  Assuming you have NodeJs installed :  
  
  1. Install Backend :  
    <code>npm install</code>  
  2. Install Frontend:  
    <code>npm install</code>
  3. Create Events Table:  
    run mgEvents.sql to create the events sql.

## Running
  Each app has a config file to store configuratoin properties for all environments (local,qa,prod) 
  you can leave every thing to the default, except the DB which you'll need to set it to your own db.  

  Running the backend  
    <code>sudo NODE_ENV=local/qa/prod node mgevents_backend.js</code>

  Running the frontend  
    <code>sudo NODE_ENV=local/qa/prod node mgevents_frontend.js</code>

## Sending Events 
  <code> <backendhost>:<port>/event/add  </code>  
  This endpoint accepts a parameter called "event" via PUT http request.  
  The "event" parameter value is a json string that represent the event to be added that looks like this  
  <code>
  {
  "event": "test event",
  "time": "1350356732665",
  "comments": "test comment",
  "family": "test comment family"
  }  
  </code>
  
  The json holds the following keys :
  1. event : is the name of the even that will be tracked.
  2. time : the time that event has occured.
  3. comments : and information you want to store along with that event.
  4. family : The family that event belongs go , so you can group related events together (make going through
     events in the UI easier).if you sent an empty event, it will be added under "Global" event family

    
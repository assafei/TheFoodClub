# TheFoodClub
Leveraging Amazon ASK services, The Food Club is a local, social, and VOCAL recommendation engine.

This project handles the Amazon ASK (Alexa Skill Kit) requests. Once a user first queries the service (e.g. "What's good around here?"), this service gets the user's GPS location and searches for nearby recommendations.

The search part includes two major parts:
 a. The wisdom of the crowd (leveraging Google Maps open urban API)
 b. The Food Club's local-friends recommendations
The two favorite options are presented to the user, who can choose one of them or change the query parameters (e.g. "find a fancier place)".

In addition to the voice feedback, once the user selects an option, this service passes the location's address to the client app (through the DB and the main web-server).
The client app then opens Google Maps with walking directions to the destination.

Technology
----------
* Amazon ASK
* Amazon Lambda (handling ASK requests)
* Node.js
* Urban data retrieved from Google Places API.
* MongoDB to sync data with main web-server
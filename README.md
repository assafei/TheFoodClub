# TheFoodClub
Leveraging Amazon ASK services, The Food Club is a local, social, and VOCAL recommendation engine.

This project handles the Amazon ASK (Alexa Skill Kit) requests. Once a user first queries the service (e.g. "What's good around here?"), we'll query their location and search for nearby recommendations.
The search part includes two major parts - wisdom of the crowd (leveraging Google Maps open API) and the Food Club's local friends recommendations.
Two favorite options are presented to the user, who can choose one of them or change the query parameters.
In addition to the voice feedback, once the user selects an option, this service passes the location's address to the client app (through the DB and the main web-server). The client app then opens Google Maps with walking directions.

Technology
----------
* Node.js
* Amazon Lambda to handle the ASK requests.
* Urban data retrieved from Google Places API.
* MongoDB to sync data with main web-server
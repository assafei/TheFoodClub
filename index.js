/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
var mongodb = require('mongodb');
var https = require('https');
var _ = require('underscore');


exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
         if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
         context.fail("Invalid Application ID");
         }
         */

        var MONGO_URL = 'mongodb://hiddengems:test123@aws-us-east-1-portal.17.dblayer.com:10014/hiddengems?ssl=true';
        mongodb.MongoClient.connect(MONGO_URL, {ssl: true,sslValidate: false}, function(err, db) {
            try {
                if (err) {
                    console.error(err);
                }
                else {
                    console.log("Code v4");
                }


                if (event.session.new) {
                    onSessionStarted({requestId: event.request.requestId}, event.session);
                }

                if (event.request.type === "LaunchRequest") {
                    onLaunch(event.request,
                        event.session,
                        function callback(sessionAttributes, speechletResponse) {
                            db.close();
                            context.succeed(buildResponse(sessionAttributes, speechletResponse));
                        });
                } else if (event.request.type === "IntentRequest") {

                    onIntent(event.request,
                        event.session,
                        db,
                        function callback(sessionAttributes, speechletResponse) {
                            db.close();
                            context.succeed(buildResponse(sessionAttributes, speechletResponse));
                        });
                } else if (event.request.type === "SessionEndedRequest") {
                    onSessionEnded(event.request, event.session);
                    db.close();
                    context.succeed();
                }
            }
            catch(e) {
                db.close();
                context.fail("Exception: " + e);
            }
        });
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, db, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("AskForRecommendationIntent" === intentName) {
        setRecommendationsParams(intent, session, db, callback);
    } else if ("FirstOptionIntent" === intentName) {
        chooseGoogleOption(intent, session, db, callback);
    } else if ("SecondOptionIntent" === intentName) {
        chooseFriendOption(intent, session, db, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
        handleSessionEndRequest(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "<s>Welcome to the Gastro Club! The best club of all clubs. </s>" +
        "<s>Great recommendations from locals are waiting for you</s><s>just ask!</s>";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please ask for recommendations about places around, " +
        "for example: what's good around here?";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    var speechOutput = "Thank you for using the Gastro Club. Have a nice day!";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Sets the parameters in the session and prepares the speech to reply to the user.
 */
function reportDataToUser(intent, session, db, googlePlaceID, specific_recommendation, callback) {
    var cardTitle = intent.name;
    var shouldEndSession = false;
    var speechOutput, repromptText;

    console.log("googlePlaceID", googlePlaceID);

    if (!googlePlaceID) {
        speechOutput = repromptText = "Please start by asking about locations, for example: give me a good place near by.";
        callback(session,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }

    function getGoogleSpecificPlace() {
        return new Promise(function(resolve, reject) {

            var gkey = "AIzaSyBkPGJjjzrnXatExlJUxyEbg0pPqQWLwrI";

            function getHTTP_Data(response) {
                console.log("Function being called...");
                var responseData = "";
                response.setEncoding("utf8");
                response.on("data", function (chunk) {
                    responseData += chunk;
                });
                response.on("end", function () {
                    console.log("RESPONSE DATA -- END", responseData);
                    responseData = JSON.parse(responseData);
                    resolve(responseData);
                });
            }
            //https://maps.googleapis.com/maps/api/place/details/output?parameters

            var options = {
                hostname: "maps.googleapis.com",
                path: "/maps/api/place/details/json?" +
                "placeid=" + googlePlaceID +
                "&key=" + gkey
            };
            console.log("Calling https...");
            var request = https.request(options, getHTTP_Data);
            request.on("error", function (error) {
                callback(new Error(error));
            });
            request.end();
        });
    }

    getGoogleSpecificPlace().then(function(locData) {
        db.collection('Users').updateOne({user_id: '1234'}, {$set: {google_place_info: locData && locData.result, google_place_info_assaf: locData}}, function(err, results) {
            speechOutput =
                "<s>Great!</s>" +
                "<s>You are on your way to " + locData.result.name + "!</s>" +
                "<s>Follow the directions on the screen and you should be there in 4 minutes.</s>" +
                "<s>Enjoy!</s>" + (specific_recommendation ? "<s>and don't forget to try the " + specific_recommendation + "... </s>" : "");
            repromptText = speechOutput;
            shouldEndSession = true;
            callback(session,
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        })
    });
}

function chooseGoogleOption(intent, session, db, callback) {

    var place_id = session.attributes && session.attributes.recommendations && session.attributes.recommendations.google && session.attributes.recommendations.google.place_id;

    reportDataToUser(intent,session, db, place_id, callback);

}
function chooseFriendOption(intent, session, db, callback) {

    var place_id = session.attributes && session.attributes.recommendations && session.attributes.recommendations.friend && session.attributes.recommendations.friend.place_id;

    reportDataToUser(intent,session, db, place_id, callback);

}


function setRecommendationsParams(intent, session, db, callback) {
    var cardTitle = intent.name;

    var repromptText = "";
    var sessionAttributes = {distance: 10, food_type: undefined, price: 2};
    var shouldEndSession = false;
    var speechOutput = "";


    if (intent.slots.Distance) {
        var distance = 10;
        console.log("typeof Distance: ", intent.slots.Distance, typeof intent.slots.Distance, intent.slots);
        if (typeof intent.slots.Distance.value == 'string') {
            if (intent.slots.Distance.value.indexOf("2") >= 0) distance = 2;
            if (intent.slots.Distance.value.indexOf("5") >= 0) distance = 5;
        }

        sessionAttributes.distance = distance;
    }
    if (intent.slots.TypeOfFood && intent.slots.TypeOfFood.value) {
        sessionAttributes.food_type = intent.slots.TypeOfFood.value.split(" ")[0];
    }
    if (intent.slots.PriceRange && intent.slots.PriceRange.value) {
        sessionAttributes.price =  intent.slots.PriceRange.value;
    }


    /*     ******************** CODE FROM OTHER PROJECT GOES BELOW ************************     */

    var my_user,
        googleOpenData,
        ownRecommendations;

    var PRICE_LEVELS = ["", "affordable", "relatively inexpensive", "quite expensive", "very expensive"];

    function getMyUserDetails() {
        return new Promise(function (resolve, reject) {
            db.collection('Users').findOne({user_id: '1234'}, function (err, user_data) {
                my_user = user_data;
                console.log("My user returned");
                resolve(my_user);
            })
        });
    }

    function getGoogleOpenData() {
        return new Promise(function(resolve, reject) {

            var gkey = "AIzaSyBkPGJjjzrnXatExlJUxyEbg0pPqQWLwrI";
            var placeSearchUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

            function getHTTP_Data(response) {
                console.log("Function being called...");
                var responseData = "";
                response.setEncoding("utf8");
                response.on("data", function (chunk) {
                    console.log("new data", chunk.length);
                    responseData += chunk;
                });
                response.on("end", function () {
                    console.log("RESPONSE DATA -- END", responseData);
                    responseData = JSON.parse(responseData);
                    googleOpenData = responseData;
                    resolve(responseData);
                });
            }

            var options = {
                hostname: "maps.googleapis.com",
                path: "/maps/api/place/nearbysearch/json?" + "location=" + my_user.loc[1] + "," + my_user.loc[0] +
                "&types=restaurant" +
                "&radius=" + (sessionAttributes.distance * 80) +
                "&key=" + gkey
            };
            console.log("Calling https...");
            var request = https.request(options, getHTTP_Data);
            request.on("error", function (error) {
                callback(new Error(error));
            });
            request.end();
        });
    }

    function queryOwnDB() {
        return new Promise(function(resolve, reject) {
            // Now let's see what our friends say.
            db.collection('Recommendations').find({
                loc: {
                    $near: {
                        $geometry: {type: "Point", coordinates: my_user.loc},
                        // $geometry: {type: "Point", coordinates: [-73.9667, 40.78]},
                        $minDistance: 0,
                        $maxDistance: sessionAttributes.distance * 80 * 1.5
                    }
                }
            }).toArray(function (err, docs) {
                if (err) throw err;
                // docs.forEach(function (doc) {
                //     console.log("Found!", doc);
                // });
                ownRecommendations = docs;

                console.log("Done query own DB: ", ownRecommendations.length);
                resolve(docs);
            });
        });
    }

    var goodGoogleSuggestions;
    var topGoogleSuggestion;

    getMyUserDetails().then(function(r) {
        console.log("got to step 2");
        return getGoogleOpenData();
    }).then(function(r) {
        console.log("got to step 3");
        return queryOwnDB();
    }).then(function(r) {

        console.log("googleOpenData", googleOpenData,"ownRecommendations",ownRecommendations);

        console.log("going to filter/sort", googleOpenData.results);
        console.log("going to filter/sort")
        // Filter out everything that includes a too generic type

        try {
            var filteredGoogleSuggestions = googleOpenData.results.filter(function (x) {
                return (x.price_level && x.price_level <= sessionAttributes.price) &&
                    (x.rating) &&
                    _.intersection(x.types, ["department_store", "clothing_store", "jewelry_store"]).length == 0;
            });
            goodGoogleSuggestions = filteredGoogleSuggestions.sort(function (a, b) {
                return b.rating - a.rating
            });
            console.log("finished filter/sort");
            topGoogleSuggestion = goodGoogleSuggestions[0];
        }
        catch(e) {
            console.error(e);
        }
        prepOutput();
    });

    function joinListOfNouns(listToJoin) {
        if (!listToJoin || !listToJoin.length || listToJoin.length <= 1) {
            return listToJoin && listToJoin.length && listToJoin[0];
        }
        var mergedList = listToJoin[0];
        for (var i = 1; i<listToJoin.length-1;i++) {
            mergedList+= ", " + listToJoin[i];
        }
        mergedList+= " and " + listToJoin[listToJoin.length-1];
        return mergedList;
    }


    function prepOutput() {
        speechOutput = "<p>" +
            "<s>The locals' favorite is " + topGoogleSuggestion.name + ", located on " + topGoogleSuggestion.vicinity.split(",")[0] + ". </s>";
        if (topGoogleSuggestion.price_level >= 3) {
            speechOutput += "<s>It is " + PRICE_LEVELS[topGoogleSuggestion.price_level] + ", but it received " + topGoogleSuggestion.rating + " stars. </s>";
        }
        else {
            speechOutput += "<s>It recieved " + topGoogleSuggestion.rating + " stars and is " + PRICE_LEVELS[topGoogleSuggestion.price_level] + ". </s>";
        }
        speechOutput+= "</p>";

        if (ownRecommendations.length > 0) {
            var friendRecommendation = ownRecommendations[0];
            speechOutput += "<p>" +
                "<s>Your friend, " + friendRecommendation.first_name + ", recommends " + friendRecommendation.place_name + ", " +
            "because of their great" + friendRecommendation.like[0] + ". </s>" + ((friendRecommendation.like.length > 1) ? "<s>The " + friendRecommendation.like[1] + " is also very good. </s>" : "");
            speechOutput += "</p>";
        }


        // "I found " + goodGoogleSuggestions.length + " recommendation on Google and " + ownRecommendations.length + " from your friends";
        if (ownRecommendations.length > 0) {
            repromptText = "Would you prefer the first option or second option?";
        }
        else {
            repromptText = "Would you like to go there now?";
        }

        speechOutput += "<p><s>" + repromptText + "</s></p>";

        sessionAttributes.recommendations = {
            google: topGoogleSuggestion,
            friend: ownRecommendations && ownRecommendations.length && ownRecommendations[0]
        };

        /*      ******************** CODE FROM OTHER PROJECT GOES ABOVE ************************        */

        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
}


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>"+output+"</speak>"
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: "<speak>"+repromptText+"</speak>"
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
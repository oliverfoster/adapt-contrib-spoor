define(['coreJS/adapt'], function (Adapt) {

function bin2hex(str) {
    var l = str.length;
    var op = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
    var output = "";
    var finished = false;
    for (var b = 0; b < 10000; b++) {
        var num = 0;
        if (b*4 >= l) break;
        for (var i = 0; i < 4; i++) {
            var index = (b*4)+i;
            if (index >= l) { finished = true; break; }
            var m = Math.pow(2,i);
            num += parseInt(str.substr(index,1)) * m;
        }
        output+=op[num];
        if (finished) break;
    }
    return output;
}

function hex2bin(str) {
    var output = "";
    var op = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
    var rev = ["0000","1000","0100","1100","0010","1010","0110","1110","0001","1001","0101","1101","0011","1011","0111","1111"];
    for (var i = 0; i < str.length; i++) {
        var v = str.substr(i,1);
        output+= rev[op.indexOf(v)];
    }
    return output;
}

window.hex2bin = hex2bin;
window.bin2hex = bin2hex;

var userSelections;
var userSelectionsBinRep;
var trackingIdSiblings;
var errored = false;
var questionTypeComponents;
var presentationTypeComponents;

    return {

        serialise: function () {
            return {
                spoor: {
                    completion: this.serialiseSaveState('_isComplete'),
                    userSelections: this.serialiseSaveUserSelections('_isComplete', "_selectionData", "_isTrackable"),
                    _isCourseComplete: Adapt.course.get('_isComplete') || false,
                    _isAssessmentPassed: Adapt.course.get('_isAssessmentPassed') || false,
                    _isAssessmentAttemptComplete: Adapt.course.get('_isAssessmentAttemptComplete') || false
                }
          };
        },

        prepUserSelections: function() {
            if (userSelections === undefined && !errored) {
                //setup save data arrays
                userSelections = [];
                var length = Adapt.course.get('_latestTrackingId') + 1;
                for (var i = 0; i < length; i++) {
                    userSelections.push(['0000','0000']);
                }

                trackingIdSiblings = {};

                var components = Adapt.components;
                components.each(function(item) {
                    var blockId = item.get("_parentId");
                    var block = Adapt.findById(blockId).toJSON();
                    var trackingId = block._trackingId;
                    item.set("_trackingId", trackingId);
                    if (trackingIdSiblings[trackingId] === undefined) trackingIdSiblings[trackingId] = [ item ];
                    else {
                        if (trackingIdSiblings[trackingId].length >= 2) {
                            var message = "This course has duplicate trackingIDs or more than 2 items in a block. Tracking ID "+ trackingId + " on block "+blockId+".\n\nPlease run the grunt process prior to deploying this module on LMS.\n\nScorm user selection tracking will not work correctly until this is done.";
                            console.error(message);
                            errored = true;
                        }
                        trackingIdSiblings[trackingId].push(item);
                        trackingIdSiblings[trackingId].sort(function(a,b) {
                            return a.get("_id") > b.get("_id ")
                                        ? 1
                                        : -1;
                        });
                        _.each(trackingIdSiblings[trackingId], function(item, index) {
                            item.set("_trackingIdIndex", index);
                        });
                    }
                });

                if (errored) return "";
            }
        },

        serialiseSaveUserSelections: function(completeattribute, selectionattribute, trackableattribute) {
            if (errored) return "";

            if (Adapt.course.get('_latestTrackingId') === undefined) {
                var message = "This course is missing a latestTrackingID.\n\nPlease run the grunt process prior to deploying this module on LMS.\n\nScorm tracking will not work correctly until this is done.";
                console.error(message);
                return;
            }

            this.prepUserSelections();

            
            _.each(trackingIdSiblings, function(tids, tidsIndex) {
                _.each(tids, function(sib, sibIndex) {
                    if (errored) return "";
                    var componentValues = userSelections[tidsIndex];
                    var isComplete = sib.get(completeattribute);
                    var isTrackable = trackableattribute=="_isOptional"
                                        ? !sib.get(trackableattribute)
                                        : sib.get(trackableattribute);
                    if (isTrackable) {
                        if ( (componentValues[sibIndex].substr(0,1) == "1") !== isComplete) {
                            switch (sib.get("_isQuestionType")) {
                            case undefined: case false:
                                componentValues[sibIndex] = "100000000000";
                                break;
                            case true:
                                var score = sib.get("_score");
                                //set complete block 1 bit
                                var completeAndHeaderBlock = "1";
                                var scoreBlock = "";
                                var userSelectionBlock = "";

                                //set score block 8 bits
                                if (score !== undefined) scoreBlock = hex2bin(Math.round(score*100).toString(16));
                                else scoreBlock = "00000000";
                                var remainingZeros = 8 - scoreBlock.length;
                                if (remainingZeros > 0) scoreBlock = (new Array(remainingZeros+1).join('0')) + scoreBlock;

                                var saveData = sib.get( selectionattribute );
                                if (saveData && saveData.length !== 0) {
                                    var totalLength = saveData.length;
                                    if (totalLength > 28) {
                                        var message = "This course has a question component (" + sib.get("_id") +  ") with more than 28 selections, please reduce the selections";
                                        console.error(message);
                                        errored = true;
                                        totalLength = 28;
                                        return;
                                    } 
                                    var sectionsRequired = Math.ceil(totalLength / 4); 

                                    //set header block 3 bits
                                    completeAndHeaderBlock += hex2bin((sectionsRequired).toString(16)).substr(0,3);

                                    //set user selection block 4 * sectionsrequired bits
                                    for (var sdi = 0; sdi < totalLength; sdi++) {
                                        userSelectionBlock += (saveData[sdi] !== false) ? "1" : "0";
                                    }
                                    var remainingZeros = (sectionsRequired * 4) - totalLength;
                                    if (remainingZeros > 0) userSelectionBlock += new Array(remainingZeros+1).join('0');

                                    //here is 12 bits minimum, 4 complete + head, 8 score, + 4 * sectionsrequire
                                } else {
                                    //set header block 3 bits
                                    completeAndHeaderBlock += "000";

                                    //here is 12 bits , 4 complete + head, 8 score
                                }
                                componentValues[sibIndex] = completeAndHeaderBlock + scoreBlock + userSelectionBlock;

                                break;
                            }
                        }
                    }
                });
            });

            var binoutput = "";
            _.each(userSelections, function(us) {
                binoutput += us.join('');    
            });

            if (errored) return "";

            var hexEncodedOutput = bin2hex(binoutput);
            console.log("TRACKING: Sent "+hexEncodedOutput.length + " bytes to the LMS for " + Adapt.components.length + " components" );

            return hexEncodedOutput;

        },

        deserialiseSaveUserSelections: function(data, completeattribute, selectionattribute) {
            if (errored) return "";

            if (Adapt.course.get('_latestTrackingId') === undefined) {
                var message = "This course is missing a latestTrackingID.\n\nPlease run the grunt process prior to deploying this module on LMS.\n\nScorm tracking will not work correctly until this is done.";
                console.error(message);
                return;
            }

            this.prepUserSelections();

            if (errored) return "";

            var bininput = hex2bin(data);
            var totalLength = bininput.length;

            var datablocks = totalLength / 4;
            var i = 0;

            _.each(userSelections, function(tids, tidsIndex) {
                _.each(tids, function(sib, sibIndex) {
                    var componentValues = userSelections[tidsIndex];
                    //get 4 bits complete + header
                    var completeAndHeaderBlock = bininput.substr(i*4,4);
                    var scoreBlock = "";
                    var userSelectionBlocks = "";
                    i+=1;
                    //check complete
                    if (completeAndHeaderBlock[0] === "1") {
                        //get 8 bits for score
                        scoreBlock = bininput.substr((i)*4,8);
                        i+=2;
                        //get section count from complete + header 3 bits
                        var datablocksections = parseInt(bin2hex(completeAndHeaderBlock.substr(1,3)+"0"), 16 );
                        if (datablocksections > 0) {
                            //get user selection blocks 4 * datablocksections
                            userSelectionBlocks = bininput.substr((i)*4,(4*datablocksections));
                            i+=datablocksections;
                        }
                    }
                    
                    componentValues[sibIndex] = completeAndHeaderBlock+scoreBlock+userSelectionBlocks;

                    if ( (componentValues[sibIndex].substr(0,1) == "1")) {
                        var item = trackingIdSiblings[tidsIndex][sibIndex];
                        switch (item.get("_isQuestionType")) {
                        case undefined: case false:
                            //item.set("_isComplete", true);
                            break;
                        case true:
                            //item.set("_isComplete", true);
                            var scoreBlock = componentValues[sibIndex].substr(4,8);
                            var userSelectionBlocks = componentValues[sibIndex].substr(12);
                            var score = parseInt(bin2hex(scoreBlock), 16) / 100;
                            var complete = true;
                            var selectionData = new Array(userSelectionBlocks.length); 
                            _.each(userSelectionBlocks, function(digit, index) {
                                selectionData[index] = (digit === "1");
                            });
                            item.set('_attemptsLeft', 0);
                            item.set('_buttonState', "submit");
                            item.set("_score", score);
                            if (score < 1) {
                                item.set("_isCorrect", false);
                            } else {
                                item.set("_isCorrect", true);
                            }
                            item.set("_selectionData", selectionData);
                            item.set("_isSubmitted", true);
                        }
                    }

                });
            });

            if (i!=datablocks) {
                var message = "An error occured restoring course data!";
                console.error(message);
            }

            var hexEncodedInput = bin2hex(bininput);
            console.log("TRACKING: Received "+hexEncodedInput.length + " bytes from LMS for " + Adapt.components.length + " components" );

        },

        serialiseSaveState: function(attribute) {
            if (Adapt.course.get('_latestTrackingId') === undefined) {
                var message = "This course is missing a latestTrackingID.\n\nPlease run the grunt process prior to deploying this module on LMS.\n\nScorm tracking will not work correctly until this is done.";
                console.error(message);
            }

            var excludeAssessments = Adapt.config.get('_spoor') && Adapt.config.get('_spoor')._tracking && Adapt.config.get('_spoor')._tracking._excludeAssessments;

            // create the array to be serialised, pre-populated with dashes that represent unused tracking ids - because we'll never re-use a tracking id in the same course
            var data = [];
            var length = Adapt.course.get('_latestTrackingId') + 1;
            for (var i = 0; i < length; i++) {
                data[i] = "-";
            }

            // now go through all the blocks, replacing the appropriate dashes with 0 (incomplete) or 1 (completed) for each of the blocks
            _.each(Adapt.blocks.models, function(model, index) {
                var _trackingId = model.get('_trackingId'),
                    isPartOfAssessment = model.getParent().get('_assessment'),
                    state = model.get(attribute) ? 1: 0;

                if(excludeAssessments && isPartOfAssessment) {
                    state = 0;
                }

                if (_trackingId === undefined) {
                    var message = "Block '" + model.get('_id') + "' doesn't have a tracking ID assigned.\n\nPlease run the grunt process prior to deploying this module on LMS.\n\nScorm tracking will not work correctly until this is done.";
                    console.error(message);
                } else {
                    data[_trackingId] = state;
                }
            }, this);

            return data.join("");
        },

        deserialise: function (data) {
            var suspendData = JSON.parse(data);

            if (suspendData.spoor.userSelections) this.deserialiseSaveUserSelections(suspendData.spoor.userSelections, '_isComplete', "_selectionData");

            _.each(this.deserialiseSaveState(suspendData.spoor.completion), function(state, blockTrackingId) {
                if (state === 1) {
                    this.markBlockAsComplete(Adapt.blocks.findWhere({_trackingId: blockTrackingId}));
                }
            }, this);

            Adapt.course.set('_isComplete', suspendData.spoor._isCourseComplete);
            Adapt.course.set('_isAssessmentPassed', suspendData.spoor._isAssessmentPassed);
            Adapt.course.set('_isAssessmentAttemptComplete', suspendData.spoor._isAssessmentAttemptComplete);

            return suspendData;
        },

        markBlockAsComplete: function(block) {
            if (!block || block.get('_isComplete')) {
                return;
            }

            var isResetOnNewSession = Adapt.config.get("_isResetOnNewSession");
            if (isResetOnNewSession === true) return; 

            block.getChildren().each(function(child) {
                child.set('_isComplete', true );
                child.set('_isSubmitted', true );
            }, this);
        },

        deserialiseSaveState: function (string) {
            var completionArray = string.split("");

            for (var i = 0; i < completionArray.length; i++) {
                if (completionArray[i] === "-") {
                    completionArray[i] = -1;
                } else {
                    completionArray[i] = parseInt(completionArray[i], 10);
                }
            }

            return completionArray;
        }

    };
});
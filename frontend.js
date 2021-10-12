'use strict';

const keypress = require('keypress');
const backend = require('./backend.js');
const helper = require('./helper.js');

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

let originalState = {
    userInput: "",
    startingLength: 4,
    lastResults: [],
    currentResults: [],
    selectedIndex: -1,
    selectionMode: false
}

let state = { ...originalState };

const resetState = () => state = { ...originalState };

const printIncreasedLevelMessage = () => {
    console.log("Your selection: " + keepState.userInput);
    console.log("\nTrust level has been increased.");
    console.log("Press any letter to continue.");
}

const printNewEntryMessage = () => {
    console.log("New entry added to database.");
    console.log("Press any letter to continue.");
}

const printDefaultMessage = () => {
    process.stdout.write("Please write at least 4 characters.\n\n");
    process.stdout.write("Start to type: " + state.userInput);
}

console.clear();

printDefaultMessage();

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
    // Exit the program if Ctrl + C is pressed
    if (key && key.ctrl && key.name == 'c') {
        console.clear();
        process.exit();
    }

    let pressedKey = key?.name || '';

    if (key) {
        console.clear();

        // If shift is pressed make the character uppercase
        if (key.shift) {
            pressedKey = pressedKey.toUpperCase();
        }

        // To add spaces
        if (key.name === 'space') {
            pressedKey = ' ';
        }

        // Otherwise the keys would literally write (for example) 'backspace' into the input field
        if (["backspace", "up", "down", "return"].includes(key.name)) {
            pressedKey = '';
        }

        // To remove characters
        if (key.name === "backspace") {
            state.userInput = state.userInput.slice(0, -1);
        }

        // Always reset the selected index if any other key is typed
        if (!["return", "up", "down"].includes(key.name)) {
            state.selectedIndex = -1;
            state.selectionMode = false;
            // It doesn't need to be checked whether the up or down key was pressed because otherwise the first if question would not fail
            // Manages the up and down events
        } else if (state.currentResults.length) {
            state.selectedIndex = helper.calculateSelectionIndex(state.selectedIndex, state.currentResults.length, key.name);

            if (state.selectedIndex == -1) {
                state.selectionMode = false;
            } else {
                state.selectionMode = true;
            }
        }

        if (key.name === 'return') {
            let keepState = { ...state };
            resetState();

            if (keepState.selectionMode) {
                let newUserInput = keepState.currentResults[keepState.selectedIndex];
                keepState.userInput = newUserInput.name;

                backend.increaseTrustLevel(keepState.userInput, newUserInput.trustLevel)

                printIncreasedLevelMessage()

            } else if (keepState.userInput.length >= keepState.startingLength) {
                // Check if the typed in value already exists in the database
                backend.getSuggestions(keepState.userInput, (results) => {
                    // Increase trust level if the value exists
                    if (results.length) {
                        results.forEach(result => {
                            if (result.name === keepState.userInput) {
                                backend.increaseTrustLevel(result.name, result.trustLevel)

                                printIncreasedLevelMessage();
                            }
                        })
                        // Add new database entry if it doesn't exist
                    } else {
                        backend.addNewName(keepState.userInput.trim());

                        printNewEntryMessage();
                    }
                })

            } else {
                printDefaultMessage();
            }
        }

        state.userInput += pressedKey;

        if (state.userInput.length >= state.startingLength) {
            backend.getSuggestions(state.userInput.trim(), results => {
                state.currentResults = results;

                // Print the suggestions via a function in backend.js
                if (results.length) {
                    process.stdout.write("Suggestions:\n")
                    process.stdout.write(helper.buildSuggestionString(results, state.selectedIndex) + "\n");
                } else {
                    process.stdout.write("No Suggestions\n\n")
                }

                // Compare each element of the last results with the current results
                // to determine which trust levels need to be decreased. 
                // Remove each element which is not present in the new results.
                results.forEach(result => {
                    let index = state.lastResults.findIndex((element) => element.name === result.name);
                    state.lastResults.splice(index, 1);
                });

                // Then loop over the left over elements of the array and lower their trust level.
                state.lastResults.forEach(result => {
                    backend.lowerTrustLevel(result.name, result.trustLevel);
                })

                state.lastResults = results;

                process.stdout.write("Start to type: " + state.userInput);
            })
        } else {
            if (key.name !== 'return') {
                printDefaultMessage();
            }
        }
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();
'use strict';

const keypress = require('keypress');
const backend = require('./backend.js');

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

let state = {
    userInput: "",
    startingLength: 4,
    lastResults: [],
    currentResults: [],
    selectedIndex: -1,
    selectionMode: false
}

console.clear();
process.stdout.write("Start to type: ");

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
    if (key && key.ctrl && key.name == 'c') {
        process.stdin.pause();
        process.exit();
    }

    let pressedKey = key ? key.name : '';

    if (key && key.shift) {
        pressedKey = pressedKey.toUpperCase();
    }

    if (key && key.name === 'space') {
        pressedKey = ' ';
    }

    if (key && (key.name === 'up' || key.name === 'down') && state.currentResults.length) {
        pressedKey = '';
        let newIndex = state.selectedIndex;
        state.selectionMode = true;

        if (key.name === 'up') {
            newIndex = newIndex - 1;
            if (newIndex == -2) {
                newIndex = state.currentResults.length - 1;
            }
        }

        if (key.name === 'down') {
            newIndex = newIndex + 1;
        }

        if (newIndex < 0 || newIndex >= state.currentResults.length) {
            newIndex = -1;
            state.selectionMode = false;
        }

        state.selectedIndex = newIndex;
    }

    if (key && key.name === "backspace") {
        console.clear()
        pressedKey = '';
        state.userInput = state.userInput.slice(0, -1);
        process.stdout.write("Start to type: " + state.userInput);
    }

    if (key && key.name === 'return') {
        pressedKey = '';

        if (state.selectionMode) {
            state.userInput = state.currentResults[state.selectedIndex].name;

            backend.increaseTrustLevel(state.userInput, state.currentResults[state.selectedIndex].trustLevel)

            console.clear();
            state.userInput = "";
            state.lastResults = [];
            state.selectedIndex = -1;
            state.selectionMode = false;
            state.currentResults = [];
        } else if (state.userInput.length >= state.startingLength) {
            backend.getSuggestions(state.userInput, (results) => {
                if (results.length) {
                    results.forEach(result => {
                        if (result.name === state.userInput) {
                            backend.increaseTrustLevel(result.name, result.trustLevel)
                        }
                    })
                } else {
                    backend.addNewName(state.userInput.trim());
                }

                console.clear();
                state.userInput = "";
                state.lastResults = [];
                state.selectedIndex = -1;
                state.selectionMode = false;
                state.currentResults = [];
            })
        }
    }

    if (key) {
        console.clear();
        state.userInput += pressedKey;

        if (state.userInput.length >= state.startingLength) {
            backend.getSuggestions(state.userInput.trim(), (results) => {
                state.currentResults = results;
                if (key.name !== 'up' && key.name !== 'down') {
                    state.selectedIndex = -1;
                }

                if (results.length) {
                    process.stdout.write("Suggestions:\n")
                    process.stdout.write(backend.buildSuggestionString(results, state.selectedIndex) + "\n");
                } else {
                    process.stdout.write("No Suggestions\n\n")
                }
                process.stdout.write("Start to type: " + state.userInput);

                results.forEach(result => {
                    let index = state.lastResults.findIndex((element) => element.name === result.name);
                    state.lastResults.splice(index, 1);
                });

                state.lastResults.forEach(result => {
                    backend.lowerTrustLevel(result.name, result.trustLevel);
                })

                state.lastResults = results;
            })
        } else {
            process.stdout.write("Start to type: " + state.userInput);
        }
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();
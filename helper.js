const calculateSelectionIndex = (currentIndex, currentResultsLength, key) => {
    let newIndex = currentIndex;

    if (key === 'up') {
        if (newIndex == -1) {
            newIndex = currentResultsLength - 1
        } else {
            newIndex--;
        }
    } else if (key === 'down') {
        if (newIndex == -1) {
            newIndex = 0;
        } else if (newIndex >= currentResultsLength - 1) {
            newIndex = -1;
        } else {
            newIndex++;
        }
    }

    return newIndex;
}

const buildSuggestionString = (rows, selectedIndex) => {
    let resultString = '';
    let index = 1;

    rows.forEach(row => {
        resultString += index + '. ' + row.name + (index - 1 == selectedIndex ? ' <--' : '') + '\n';
        index++;
    });

    return resultString;
}

exports.calculateSelectionIndex = calculateSelectionIndex;
exports.buildSuggestionString = buildSuggestionString;
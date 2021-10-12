'use strict';
require('dotenv').config();

const mysql = require('mysql');

let connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect(err => {
    if (err) throw err;
});

const getSuggestions = (name, callback) => {
    connection.query(`SELECT name, trustLevel FROM names WHERE name LIKE '${name}%' ORDER BY trustLevel desc LIMIT 3;`, (err, result) => {
        if (err) throw err;

        return callback(result)
    });
}

const closeConnection = () => {
    connection.destroy();
}

const lowerTrustLevel = (name, oldTrustLevel) => {
    let newTrustLevel = (oldTrustLevel - (1 - oldTrustLevel) * process.env.LOWER_TRUST_LEVEL_FACTOR).toFixed(6);
    connection.query(`UPDATE names SET trustLevel = ${newTrustLevel} WHERE name = '${name}';`);
}

const increaseTrustLevel = (name, oldTrustLevel) => {
    let newTrustLevel = (oldTrustLevel + (1 - oldTrustLevel) * process.env.INCREASE_TRUST_LEVEL_FACTOR).toFixed(6);
    connection.query(`UPDATE names SET trustLevel = ${newTrustLevel} WHERE name = '${name}';`);
}

const addNewName = (name) => {
    connection.query(`INSERT INTO names (name, trustLevel) VALUES ('${name}', ${process.env.DEFAULT_TRUST_LEVEL});`);
}

exports.getSuggestions = getSuggestions;
exports.closeConnection = closeConnection;
exports.lowerTrustLevel = lowerTrustLevel;
exports.addNewName = addNewName;
exports.increaseTrustLevel = increaseTrustLevel;
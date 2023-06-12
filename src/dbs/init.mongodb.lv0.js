'use strict'

const mongoose = require('mongoose')

const connectString = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

mongoose.connect(connectString.then( _ => console.log(`Connected Mongodb Success`)).catch(err => console.log(`Error Connect!`)))

if(1 === 0) {
    mongoose.set('debug', true);
    mongoose.set('debug', { color: true})
}

module.exports = mongoose
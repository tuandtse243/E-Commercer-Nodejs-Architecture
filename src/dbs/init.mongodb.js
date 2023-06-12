'use strict'

const mongoose = require('mongoose')
// const { dev, pro } = require('../configs/config.mongodb.js')
// const {db: {host, port, name} } = dev;

// const connectString = `mongodb://${host}:${port}/${name}`;
const connectString = `mongodb+srv://tuandtse243:tuandtse243@cluster0.zzbvaga.mongodb.net/Shop`;
const { countConnect } = require('../helpers/check.connect');

class Database {
    constructor(){
        this.connect();
    }

    // connect
    connect(type = 'mongodb') {
        if(1 === 1) {
            mongoose.set('debug', true);
            mongoose.set('debug', { color: true})
        }

        mongoose.connect(connectString).then( _ => console.log(`Connected Mongodb Success`, countConnect())).catch(err => console.log(`Error Connect!`))
    }

    static getInstance() {
        if(!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }
}

const instanceMongodb = Database.getInstance()
module.exports = instanceMongodb;
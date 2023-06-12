require('dotenv').config();
const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet');
const compression = require('compression');
const app = express();


// middleware
// Ghi log
app.use(morgan('dev'));
// security web
app.use(helmet());
// giảm dung lượng file tải cho web
app.use(compression());
// dùng để lấy data trong body gửi từ req xuống 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init DB
require('./dbs/init.mongodb.js');
// const { countConnect, checkOverload } = require('./helpers/check.connect.js');
// countConnect();
// checkOverload()

// init routes
app.use('/', require('./routers'));

// handler error
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
})

app.use((error, req, res, next) => {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        stack: error.stack,
        message: error.message || 'Internal Server Error'
    })
})

module.exports = app
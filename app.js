
const express  = require('express');
const compression = require('compression');
const cors = require('cors');
const router = require('./route');
const errorHandler = require('errorhandler');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

const _PORT = 1337;
app.set('port', process.env.PORT || _PORT);
const isProduction = process.env.NODE_ENV === 'production';

mongoose.promise = global.Promise;

app.use(compression());
app.use(cors());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use('/api', router);
app.use(express.static(__dirname + "/storage"));

if(!isProduction) {
    app.use(errorHandler());
}

if(!isProduction) {
    app.use((err, req, res, next) => {
        res.status = err.status || 500;
    
        res.json = {
        errors: {
            message: err.message,
            error: err,
        },
        };
        next();
    });
}

app.get("/", (req, res)=>{
    res.json("Hello");
});

app.listen(app.get("port"), () => console.log('Server running on port : ' + _PORT));

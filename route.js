const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const passport = require('passport');
const md5 = require('md5');
const auth = require('./config/auth');
const jwt = require('jsonwebtoken');
const fs = require("fs");
const path = require("path");

const router = express.Router();

mongoose.connect('mongodb://yassinereptor:85001997fil@ds135427.mlab.com:35427/recyclers_db', {useNewUrlParser: true});
mongoose.set('debug', true);

require('./models/users');
require('./models/product');
require('./models/review');
require('./config/passport');

const Users = mongoose.model('Users');
const Product = mongoose.model('Product');
const Review = mongoose.model('Review');


router.post('/signup', auth.optional, (req, res, next) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        company_name: req.body.company,
        company_id: req.body.company,
        cin: req.body.cin,
        phone: req.body.phone,
        seller: req.body.seller,
        bayer: req.body.bayer,
        lat: req.body.lat,
        lng: req.body.lng,
        country: req.body.country,
        pos: req.body.pos,
        profile: req.body.profile
    }

    if (!user.email) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }

    if (!user.password) {
        return res.status(422).json({
            errors: {
                password: 'is required',
            },
        });
    }


    if (!user.name) {
        return res.status(422).json({
            errors: {
                name: 'is required',
            },
        });
    }

    if (!user.cin) {
        return res.status(422).json({
            errors: {
                cin: 'is required',
            },
        });
    }

    if (!user.phone) {
        return res.status(422).json({
            errors: {
                phone: 'is required',
            },
        });
    }

    if (!user.lat && !this.user.lng) {
        return res.status(422).json({
            errors: {
                latlng: 'is required',
            },
        });
    }

    if (!user.country) {
        return res.status(422).json({
            errors: {
                country: 'is required',
            },
        });
    }

    const finalUser = new Users(user);

    finalUser.setPassword(user.password);

    return finalUser.save()
        .then(() => res.json({
            user: finalUser.toAuthJSON()
        }));
});

router.post('/login', auth.optional, (req, res, next) => {
    const userObj = {
        email: req.body.email,
        password: req.body.password,
    }

    console.log(userObj);

    if (!userObj.email) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }

    if (!userObj.password) {
        return res.status(422).json({
            errors: {
                password: 'is required',
            },
        });
    }

    return passport.authenticate('local', {
        session: false
    }, (err, passportUser, info) => {

        if (err) {
            return res.status(400).json(err);
        }

        if (passportUser) {

            const user = passportUser;
            user.token = passportUser.generateJWT();

            return res.json({
                user: user.toAuthJSON()
            });
        }

        return res.status(422).json({
            errors: {
                info: 'invalide',
            },
        });
    })(req, res, next);
});

router.get('/current', auth.required, (req, res, next) => {
    const id = req.query.id;

    console.log("*************************");

    return Users.findById(id)
        .then((user) => {
            if (!user) {
                return res.sendStatus(400);
            }
            console.log(user);
            return res.json({
                user: user
            });
        });
});


router.post('/product/add', auth.required, (req, res, next) => {
    const prod = {
        user_id: req.body.user_id,
        user_name: req.body.user_name,
        title: req.body.title, 
        desc: req.body.desc,
        price: req.body.price,
        quantity: req.body.quantity,
        quality: req.body.quality,
        fix: req.body.fix,
        bid: req.body.bid,
        unit: req.body.unit,
        cat: req.body.cat,
        time: req.body.time,
    }

    console.log(prod);

    if (!prod.user_id) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }

    if (!prod.title) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }

    if (!prod.price) {
        return res.status(422).json({
            errors: {
                password: 'is required',
            },
        });
    }

   

    var images = Array();


    var user_data = jwt.verify(req.headers.authorization.split(" ")[1], "1337fil");
    req.body.images.forEach(element => {
        var name  = md5(req.headers.authorization + (new Date()).getTime());
        var folder = "storage/products/" + user_data.id;
        if (!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }
        images.push(name + ".png");
        fs.writeFile(folder + "/" + name + ".png", element, 'base64', function(err) {
            console.log(err);
            });

    });

    prod.images = images;
    const finalProduct = new Product(prod);

    return finalProduct.save()
        .then(()=> {
        return res.json({
            result: true
        });
    });

});


router.post('/product/load', auth.optional, (req, res, next) => {
    const payload = {
        filter: req.body.filter,
        cat: req.body.cats,
        limit: parseInt(req.body.limit),
        skip: parseInt(req.body.skip)
    }

    var array = Array();
    payload.cat.forEach((item)=>{
        array.push({"cat": item});
    });
    Product.find((array.length > 0)? {$or: array} : {}).sort([[payload.filter, -1]]).skip(payload.skip).limit(payload.limit).exec((err, data) => {
        if(err)
            return res.json(err);
        console.log(data); 
        res.json(data); 
    });
});

router.post('/product/review', auth.optional, (req, res, next) => {
    const payload = {
        post_user_id: req.body.post_user_id,
        user_id: req.body.user_id,
        post_id: req.body.post_id,
        text: req.body.text,
        rate: req.body.rate,
        time: req.body.time
    }

    console.log(payload);
    const finalReview = new Review(payload);

    return finalReview.save()
        .then(()=> {
        return res.json({
            result: true
        });
    });
});

router.post('/product/review/load', auth.optional, (req, res, next) => {
    const payload = {
        post_user_id: req.body.post_user_id,
        limit: parseInt(req.body.limit),
        skip: parseInt(req.body.skip)
    }

    Product.find({"post_user_id": payload.post_user_id}).sort([["time", -1]]).skip(payload.skip).limit(payload.limit).exec((err, data) => {
        if(err)
            return res.json(err);
        console.log(data);   
        res.json(data); 
    });
});

module.exports = router;
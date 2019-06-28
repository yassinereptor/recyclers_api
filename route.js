const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const passport = require('passport');
const auth = require('./config/auth');

const router = express.Router();

mongoose.connect('mongodb://yassinereptor:85001997fil@ds135427.mlab.com:35427/recyclers_db', {useNewUrlParser: true});
mongoose.set('debug', true);

require('./models/users');
require('./config/passport');

const Users = mongoose.model('Users');


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

module.exports = router;
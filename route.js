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
        company_name: req.body.company_name,
        company_id: req.body.company_id,
        cin: req.body.cin,
        phone: req.body.phone,
        seller: req.body.seller,
        bayer: req.body.bayer,
        lat: req.body.lat,
        lng: req.body.lng,
        country: req.body.country,
        pos: req.body.pos,
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

    if(req.body.profile != "non")
        user.profile = "yes";
    else
        user.profile = "non";

    const finalUser = new Users(user);
    finalUser.setPassword(user.password);
    return finalUser.save()
        .then(()=>{
            if(req.body.profile != "non")
            {
                var folder = "storage/profiles";
                fs.writeFile(folder + "/" + finalUser.toAuthJSON()._id + ".png", req.body.profile, 'base64', function(err) {
                    console.log(err);
                    });
            }
            return res.json({
            user: finalUser.toAuthJSON()
        })});
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



router.post('/info', auth.optional, (req, res, next) => {
    const id = req.body.id;


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
        profile: req.body.profile,
        time: req.body.time
    }

    console.log(payload);


    Users.findById({_id: payload.user_id}).exec((err, data) => {
        if(err)
            return res.json(err);

        payload.user_name = data.name;
        const finalReview = new Review(payload);
        return finalReview.save()
            .then(()=> {
            return res.json({
                result: true
            });
        });
    });
   
});

router.post('/product/review/load', auth.optional, (req, res, next) => {
    const payload = {
        post_user_id: req.body.post_user_id,
        limit: parseInt(req.body.limit),
        skip: parseInt(req.body.skip)
    }

    Review.find({"post_id": payload.post_user_id}).sort([["time", -1]]).skip(payload.skip).limit(payload.limit).exec((err, data) => {
        if(err)
            return res.json(err);
        return res.json(data);
    });
});

router.post('/cart/load', auth.required, (req, res, next) => {
    const id = req.body.id;

    var prods = new Array();

    Users.findById(id).exec((err, data) => {
        if(err)
            return res.json(err);
        var ids = new Array();

        data.cart.forEach((item)=>{
            ids.push(item.prod_id);
        });

        Product.find({'_id': {$in: ids}}).exec((err, prods) => {
            if(err)
                return res.json(err);
            var p = Array();
            p = prods.map((item, index)=>{
                var i = {
                    ...item._doc,
                    "order": data.cart[index].quantity
                };
                return (i);
            });
            return res.json(p);
        });
    });
});



function itemExists(arr, id) {
return arr.some(function(el) {
    return el.prod_id === id;
}); 
}


function bidExists(arr, id) {
    return arr.some(function(el) {
        return el.user_id === id;
    }); 
}

    
router.post('/cart/add', auth.required, (req, res, next) => {
    const id = req.body.id;
    const prod_id = req.body.prod_id;
    const quantite = req.body.quantite;


    Users.findById(id).exec((err, data)=>{
        if(err)
            return res.sendStatus(400).json(err);
        if(data.cart)
        {
            
            if(!itemExists(data.cart, prod_id))
            {
                data.cart.push({
                    "prod_id": prod_id,
                    "quantity": quantite
                });
                data.save();
                return res.json({result: true});            
            }
            else
            {
                data.cart = data.cart.filter(function(item) {
                    return item.prod_id !== prod_id
                });
                data.save();
                return res.json({result: true}); 
            }
        }
        
    });

    
});

router.post('/cart/removeall', auth.required, (req, res, next) => {
    const id = req.body.id;

    Users.findById(id).exec((err, data)=>{
        if(err)
            return res.sendStatus(400).json(err);
        if(data.cart)
        {
            data.cart = [];
            data.save();
            return res.json({result: true}); 
        }
    });

    
});


router.post('/cart/total', auth.required, (req, res, next) => {
    const id = req.body.id;

    Users.findById(id).exec((err, data) => {
        if(err)
            return res.json(err);
        var ids = new Array();

        data.cart.forEach((item)=>{
            ids.push(item.prod_id);
        });

        Product.find({'_id': {$in: ids}}).exec((err, prods) => {
            if(err)
                return res.json(err);
            var p = Array();
            p = prods.map((item, index)=>{
                var i = {
                    ...item._doc,
                    "order": data.cart[index].quantity
                };
                return (i);
            });
            var total = 0;
            p.forEach((item)=>{
                total += item.order * item.price;
            });
            return res.json(total);
        });
    });

    
});

router.post('/bid/add', auth.required, (req, res, next) => {
    const id = req.body.id;
    const prod_id = req.body.prod_id;
    const bid = req.body.bid;


    Product.findById(prod_id).exec((err, data)=>{
        if(err)
            return res.sendStatus(400).json(err);
            console.log(data.bid_list);
        Users.findById(id).exec((err, user)=>{
            if(err)
                return res.sendStatus(400).json(err);
                console.log(user.bid_list);
            if(!itemExists(user.bid_list, prod_id))
            {
                user.bid_list.push({
                    "prod_id": prod_id,
                    "bid": bid
                });
                user.save();
            }
            else
            {
                user.bid_list = user.bid_list.filter(function(item) {
                    return item.prod_id !== prod_id
                });
                user.save();
            }
            
            if(!bidExists(data.bid_list, id))
            {
                data.bid_list.push({
                    "user_id": id,
                    "bid": bid
                });
                data.save();
                return res.json({result: true});
            }
            else
            {
                data.bid_list = data.bid_list.filter(function(item) {
                    return item.user_id !== id
                });
                data.save();
                return res.json({result: true});
            }
        });
    });

    
});


router.post('/bid/load', auth.required, (req, res, next) => {
    const id = req.body.id;
    
    // var prods = new Array();

    Users.findById(id).exec((err, data) => {
        if(err)
            return res.json(err);
        var ids = new Array();

        data.bid_list.forEach((item)=>{
            ids.push(item.prod_id);
        });

        Product.find({'_id': {$in: ids}}).exec((err, prods) => {
            if(err)
                return res.json(err);
            var p = Array();
            p = prods.map((item, index)=>{
                var i = {
                    ...item._doc,
                    "bid": data.bid_list[index].bid
                };
                return (i);
            });
            return res.json(p);
        });
    });
});


router.post('/credit/add', auth.required, (req, res, next) => {
    const id = req.body.id;
    const type = req.body.type;
    const card_id = req.body.card_id;
    const card_number = req.body.card_number;
    const card_holder = req.body.card_holder;
    const card_exp = req.body.card_exp;
    const card_cvc = req.body.card_cvc;
    const card_time = req.body.card_time;


    Users.findById(id).exec((err, user)=>{
        if(err)
            return res.sendStatus(400).json(err);
        console.log(user.credit);
        var obj = (type == "MasterCard" || type == "Visa")? {
            "type" : type,
            "card_id" : card_id,
            "card_number" : card_number,
            "card_holder" : card_holder,
            "card_exp" : card_exp,
            "card_cvc" : card_cvc,
            "card_time" : card_time
        }:
        {
            "type" : type,
        }
        user.credit.push(obj);
        user.save();
        return res.json({result: true}); 
    });

    
});


router.post('/credit/delete', auth.required, (req, res, next) => {
    const id = req.body.id;
    const card_id = req.body.card_id;

    Users.findById(id).exec((err, user)=>{
        if(err)
            return res.sendStatus(400).json(err);
        user.credit = user.credit.filter((item)=>{
            return item.card_id !== card_id
        });
        user.save();
        return res.json({result: true}); 
    });

    
});

router.post('/credit/load', auth.required, (req, res, next) => {
    const id = req.body.id;
    const payload = {
        limit: parseInt(req.body.limit),
        skip: parseInt(req.body.skip)
    }

    Users.findById(id).skip(payload.skip).limit(payload.limit).exec((err, user)=>{
        if(err)
            return res.sendStatus(400).json(err);
        return res.json(user.credit); 
    });

    
});



router.post('/profile/mode', auth.required, (req, res, next) => {
    const id = req.body.id;
    const seller = req.body.seller;
    const bayer = req.body.bayer;


    Users.findById(id).exec((err, data)=>{
        if(err)
            return res.sendStatus(400).json(err);
 
        data.seller = seller;
        data.bayer = bayer;
        data.save();
        return res.json({result: true});            
       
    });
    
});

router.get('/admin/users', auth.optional, (req, res, next) => {
    Users.find().exec((err, data)=>{
        if(err)
            return res.sendStatus(400).json(err);
        return res.json(data);            
    });
});

router.get('/admin/products', auth.optional, (req, res, next) => {
    Product.find().exec((err, data)=>{
        if(err)
            return res.sendStatus(400).json(err);
        return res.json(data);            
    });
});

router.post('/admin/users/delete', auth.optional, (req, res, next) => {
    var id = req.body.id;
    Users.findByIdAndDelete(id);
});


router.post('/admin/products/delete', auth.optional, (req, res, next) => {
    var id = req.body.id;
    Product.findByIdAndDelete(id);
});


router.post('/admin/product/add', auth.optional, (req, res, next) => {
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

    var images = Array();

    var user_data = "";
    if(req.headers.authorization)
        user_data = jwt.verify(req.headers.authorization.split(" ")[1], "1337fil");
    if(req.body.images)
    {
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
    }
    const finalProduct = new Product(prod);

    return finalProduct.save()
        .then(()=> {
        return res.json({
            result: true
        });
    });

});

module.exports = router;
const express = require('express');
const Users = require('../../models/Users');
const keys= require('../../config/keys')
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt= require('jsonwebtoken');
const passport = require('passport')

//Load input validation
const validateRegisterInput= require('../../validation/register');
const validateLoginInput = require('../../validation/login');

//@route    GET api/users/test
//@desc     Tests users route
//@access   Public

router.get('/test', (req,res) => res.json({msg: "Users Works"}));

//@route    GET api/users/register
//@desc     Register users
//@access   Public

router.post('/register', (req, res) => {
    const {errors, isValid} = validateRegisterInput(req.body);

    //Check Validation
    if(!isValid) {
        return res.status(400).json(errors);    
    }   

    Users.findOne({email: req.body.email})
    .then(user => {
        if(user) {
            errors.email= "Email already exist";
            return res.status(400).json(errors);
        } else {
            const avatar = gravatar.url(req.body.email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                avatar,
                password: req.body.password
             });

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err;
                    newUser.password= hash;
                    newUser.save()
                    .then(user => res.json(user))
                    .catch(err => console.log(err));
                })
            })
        }
    });
});

//@route    GET api/users/login 
//@desc     Login users / Returning jwt token
//@access   Public

router.post('/login', (req, res) => {
    const {errors, isValid} = validateLoginInput(req.body);

    //Check Validation
    if(!isValid) {
        return res.status(400).json(errors);    
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find User by email

    User.findOne({email}).then(user => {
        //Check for user
        if(!user) {
            errors.email= "User not found"
            return res.status(404).json(errors);
        }
        //Check Password
        bcrypt.compare(password, user.password)
        .then(isMatch => {
            if(isMatch) {
            //USer matched
                const payload = {id: user.id, name: user.name , avatar: user.avatar} //Create jwt payload
            //sign token
            jwt.sign(
                payload,
                keys.secretOrKey, 
                {expiresIn: 3600}, 
                (err, token) => {
                    res.json({
                        success: true,
                        token: 'Bearer' + token
                    })
            });

            } else {
                errors.password= "Password incorrect"
                return res.status(400).json(errors);
            }
        })
    })
});

//@route    GET api/users/current
//@desc     Return current user
//@access   Private

router.get('/current', passport.authenticate('jwt', {session: false}), 
(req,res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    })
});

module.exports= router;
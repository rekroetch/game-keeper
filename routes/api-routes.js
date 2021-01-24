// Require models and passport as we've configured it
const db = require("../models");
const passport = require("../config/passport");
// const passport= require("passport");
const jwt = require("jsonwebtoken");

// Local storage from node-localstorage npm package
// This is for server side (back end), not client side (front end)
if (typeof localStorage === "undefined" || localStorage === null) {
    const LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

module.exports = function (app) {
    app.post("/api/login", async (req, res, next) => {

        passport.authenticate(
            "local",
            async (err, user, info) => {
                try {
                    if (err || !user) {
                        const error = new Error('An error occurred.');
                        console.log(err)
                        return next(error);
                    }

                    console.log(user)
                    // req.login(
                    //   user,
                    //   { session: true },
                    //   async (error) => {
                    //     if (error){
                    //       return next(error);
                    //     } 
                    //     const body = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
                    //     const token = jwt.sign({ user: body }, 'TOP_SECRET');
                    //     return res.json({ token });
                    //   }
                    // );
                    req.login(
                        user,
                        { session: true },
                        async (error) => {
                            if (error) {
                                return next(error);
                            }
                            const payload = {
                                id: user.id,
                                email: user.email,
                                firstName: user.firstName,
                                lastName: user.lastName
                            }
                            const options = {
                                subject: `${user.id}`,
                                expiresIn: 3600
                            }
                            const token = jwt.sign({ user: payload }, 'TOP_SECRET', options);
                            return res.json({ token });
                        }
                    );
                } catch (err) {
                    return err;
                }
            }
        )(req, res, next);
    });

    // If the user is created successfully, proceed to log the user in
    // Otherwise send back an error
    app.post("/api/signup", function (req, res) {
        db.User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password
        })
            .then(() => {
                res.redirect(307, "/api/login");
            })
            .catch(err => {
                res.status(401).json(err);
            });
    });

    // Route for logging the user out
    app.get("/logout", (req, res) => {
        localStorage.removeItem("myToken");
        req.logout();
        res.redirect("/");
    });

    // Route for getting some data about our user to be used client side
    app.get("/api/user_data", passport.authenticate('jwt', { session: true }), (req, res) => {
        if (!req.user) {
            // If the user is not logged in, send back an empty object
            res.json({});
        } else {
            // Otherwise send back the user's first name and id
            // NOT sending back a password or even a hashed password
            res.json({
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName
            });
        };
    });

    app.get("/api/wishlist", passport.authenticate('jwt', { session: false }), (req, res) => {
        db.Games.findAll({
            where: {
                own: false
            }
        }).then(function (dbGames) {
            res.json(dbGames);
        });

    });

    app.put("/api/wishlist/:id", passport.authenticate('jwt', { session: true }), (req, res) => {

        db.Games.update(
            { own: true },
            {
                where: {
                    game_ID: req.params.id
                }
            }).then(function (dbGames) {
                res.json(dbGames);
            });

    });

    app.get("/api/mygames", passport.authenticate('jwt', { session: true }), (req, res) => {
        db.Games.findAll({
            where: {
                own: true
            }
        }).then(function (dbGames) {
            res.json(dbGames);
        });
    });

    app.post("/api/members", passport.authenticate('jwt', { session: true }), function (req, res) {
        db.Games.create({
            game_ID: req.body.game_ID,
            own: req.body.own,
            UserId: req.body.UserId,
        })
            .then(() => {
                res.status(200);
            })
            .catch(err => {
                console.log(err)
                res.status(500).json(err);
            });
    });

    app.delete("/api/wishlist/:id", function (req, res) {
        db.Games.destroy({
            where: {
                game_ID: req.params.id
            }
        }).then(function (dbGames) {
            res.json(dbGames);
        });
    });

    app.delete("/api/mygames/:id", function (req, res) {
        db.Games.destroy({
            where: {
                game_ID: req.params.id
            }
        }).then(function (dbGames) {
            res.json(dbGames);
        });
    });
};


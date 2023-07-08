require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

mongoose.set("strictQuery", false);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
   secret: process.env.SECRET,
   resave: false,
   saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/logindb");

const audiSchema = new mongoose.Schema({
   name: String,
   address: String,
   noOfSections: String,
   noOfRows: String,
   noOfSeats: String,
   price: String,
   ticket: String,
   luggage: String,
   food: String
});

const Audi = new mongoose.model("Audi", audiSchema);

const bookedSchema = new mongoose.Schema({
   name: String,
   noOfSeats: String,
   price: String
});

const bookedSeats = new mongoose.model("bookedSeats", bookedSchema);

const userSchema = new mongoose.Schema({
   name: String,
   phoneNo: String,
   role: String,
   nameOfCompany: String,
   address: String,
   contactNumber: String,
   emailAddress: String,
   audis: [audiSchema],
   bookedSeats: [bookedSchema]
});

userSchema.plugin(passportLocalMongoose); // cookies and sessions

const User = new mongoose.model("User", userSchema);

const userFeedbackSchema = new mongoose.Schema({
   nameOfCompany: String,
   emailAddress: String,
   feedback: String
});

const UserFeedback = new mongoose.model("UserFeedback", userFeedbackSchema);

passport.use(User.createStrategy()); //from passport-local-mongoose package

passport.serializeUser(User.serializeUser()); //from passport-local-mongoose package
passport.deserializeUser(User.deserializeUser()); //from passport-local-mongoose package

app.post('/login',
passport.authenticate('local', { failureRedirect: '/login'}), function(req, res) {
   if(req.body.role === "Patron"){
      res.redirect("/selectAudi");
   }
   else{
      res.redirect("/existing-audi");
   }
});

app.get("/", function (req, res) {
   res.render("home");
});

app.route("/selectSeats")
   .get(function (req, res) {
      res.render("selectSeats");
   })

   .post(function(req, res){
      async function findAudi() {
         const audi = Audi.find({_id: req.body.audiName});
         return audi;
      }
      findAudi().then(function (foundAudi) {
         const seat = new bookedSeats ({
            name: foundAudi[0].name,
            price: req.body.priceChild,
            noOfSeats: req.body.countChild
         });
         seat.save();
         req.user.bookedSeats.push(seat);
         req.user.save();
      });
      res.render("acknowledgement");
   });

app.get("/deleteProfile", function(req, res){
   User.deleteOne({username: req.user.username}).then(function(){
      console.log("user deleted");
   });
   res.redirect("/feedbackForm");
});

app.route("/feedbackForm")
   .get(function (req, res) {
      res.render("feedbackForm");
   })
   .post(function (req, res) {
      const ff = new UserFeedback ({
         nameOfCompany: req.body.nameOfCompany,
         emailAddress: req.body.emailAddress,
         feedback: req.body.feedback
      })
      ff.save();
      res.render("FeedbackSubmitted");
   });

app.get("/bookedSeats", function (req, res) {
   res.render("bookedSeats", {audis: req.user.bookedSeats});
});

app.route("/selectAudi")
   .get(function (req, res) {
      if (req.isAuthenticated()) {

         async function getAudis(){
            const audis = await Audi.find({});
            return audis;
         }

         getAudis().then(function (foundAudi){
            res.render("selectAudi", {audis: foundAudi, name: req.user.name});
         });
      }
      else {
         res.redirect("/login");
      }
   })

   .post(function(req, res){
      async function getAudi(){
         const audi = await Audi.findById(req.body.audiSelected);
         return audi;
      }
      getAudi().then(function (foundAudi){
         res.render("selectSeats", {audi: foundAudi});
      });
   });

app.route("/signup")
   .get(function (req, res) {
   res.render("signup");
   })
   .post(function (req, res) {
      async function run() {
         await User.register({username: req.body.username, name: req.body.name, phoneNo: req.body.phoneNo, role: req.body.role}, req.body.password, function(err, user) {
            if (err) {
               console.log(err);
               res.redirect("/home");
            }
            else {
               passport.authenticate("local")(req, res, function() {
                  if(req.body.role === "Patron"){
                     res.redirect("/selectAudi");
                  }
                  else{
                     res.redirect("/signupBusiness");
                  }
               });
            }
         });
      }
      run();
   });

app.route("/signupBusiness")
   .get(function(req, res) {
      res.render("signupBusiness");
   })
   .post(function(req, res) {
      async function run() {
         await User.findOneAndUpdate({username: req.body.emailAddress}, {$set: {nameOfCompany: req.body.nameOfCompany, contactNumber: req.body.ContactNumber, emailAddress: req.body.emailAddress, address: req.body.Address}}, {new: true});
         console.log(req.body);
      }
      run();
      res.redirect("existing-audi");
   });

app.route("/login")
   .get(function (req, res) {
      res.render("login");
   });

app.get("/existing-audi", function (req, res) {
   if (req.isAuthenticated()) {
      res.render("existing-audi", {audis: req.user.audis});
   }
   else {
      res.redirect("/login");
   }
});

app.route("/addAudi")
   .get(function (req, res) {
      res.render("addAudi");
   })
   .post(function(req, res) {
      if (req.isAuthenticated()) {
         console.log(req.user);
         const audi = new Audi ({
            name: req.body.name,
            address: req.body.address,
            noOfSections: req.body.noOfSections,
            noOfRows: req.body.noOfRows,
            noOfSeats: req.body.noOfSeats,
            price: req.body.price,
            ticket: req.body.ticket,
            luggage: req.body.luggage,
            food: req.body.food
         });
         audi.save();
         req.user.audis.push(audi);
         req.user.save();
      }
      res.redirect("/existing-audi");
   });

app.route("/profile")
   
   .get(function (req, res) {
      console.log(req.user);
      res.render("profile", {user: req.user, edit: false});
   })
   
   .post(function(req, res) {
      console.log(req.user);
      res.render("profile", {user: req.user, edit: req.body.edit});
   });

app.post("/saveProfile", function(req, res) {
   console.log(req.user);
   if (req.body.name) {
      req.user.name = req.body.name;
   }
   if (req.body.phoneNo) {
      req.user.phoneNo = req.body.phoneNo;
   }
   if (req.body.password) {
      req.user.password = req.body.password;
   }
   if(req.user.role === "Business Partner"){
      if (req.body.nameOfCompany){
         req.user.nameOfCompany = req.body.nameOfCompany;
      }
      if (req.body.address){
         req.user.address = req.body.address;
      }
      if (req.body.contactNumber){
         req.user.contactNumber = req.body.contactNumber;
      }
   }
   req.user.save();
   console.log(req.user);
   res.redirect("/profile");
});

app.get("/bookedSeats", function (req, res) {
   res.render("bookedSeats");
});

app.get("/acknowledgement", function (req, res) {
   res.render("acknowledgement");
});

app.post("/logout", function (req, res) {
   req.logout(function(err) {
      if (err) {
         res.send(err);
      }
      else {
         res.redirect("/home");
      }
   });
});

app.listen(3000, function () {
   console.log("Server started on port 3000");
});
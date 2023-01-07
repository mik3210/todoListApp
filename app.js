//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const { MongoClient } = require ("mongodb");
mongoose.set("strictQuery", true);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//mongoose connection setup
mongoose.connect("mongodb+srv://mik3210:Test-123@mike-w.vwpypjn.mongodb.net/todoListDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log(`CONNECTED TO MONGO!`);
  })
  .catch((err) => {
    console.log(`OH NO! MONGO CONNECTION ERROR!`);
    console.log(err);
  });


//mongoose SCHEMA setup
const itemsSchema = {
  name: String
}

//mongoose MODEL setup
const Item = mongoose.model("Item", itemsSchema);

//documents
const bread = new Item({
  name: "100% Whole Grain Bread"
});
const yogurt = new Item({
  name: "Strawberry Non-Fat Yogurt"
});
const cheese = new Item({
  name: "Mozarella Part-Skim Cheese"
});
//all the items in items to start with on rendered page
const defaultItems = [bread, yogurt, cheese];



//list Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
}


//list Model
const List = mongoose.model("List", listSchema);


/**** app.get... Puts defaultItems if there is a blank array*******/
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully Saved defaultItems into DB \n");
        } //end of nested if/else
      }); //end of Item.insertMany()

      res.redirect("/");
    } else {

      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      }); //end of res.render()
    } //end of if/else
  }); //end of Item.find()
}); //end of app.get()


/*******post route to root and creating new list item******/
app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });//end of item = new Item()

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function (err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });//end of findOne()
  }//end of if/else


});//end of app.post()


/***********post route to /delete********/
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

if(listName === "Today"){
  Item.findByIdAndRemove(checkedItemId, function(err) {
    if (!err) {
      console.log("Successfully deleted document");
      res.redirect("/");
    } else {
      console.log(err);
    }//end of if/else
  })//end of Item.findbyIDAndRemove
}else{
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if(!err){
      res.redirect("/" + listName);
    }//end of if
  });//end of findOneAndUpdate
}//end of if else



});


/********use of express routing paramters to /:listName****/
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.render("list", {
          listTitle : list.name,
          newListItems: list.items
        });
      } else {
        //show and existing listTitle
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      } //end of nested if/else
    } else {
      console.log("error in app.get(/:customListName" + err);
    } //end of if/else
  }); //end of findOne
}); //end of app.get



/*************** app.get renders about page**********/
app.get("/about", function(req, res) {
  res.render("about");
});


/*************listens on port 3000 with log to terminal*****/
app.listen(3000, function() {
  console.log("Server started on port 3000");
});

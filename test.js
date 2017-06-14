var async = require('asynce'); // this library helps you run async codes

// this code is not manageable, bc itll try to run all the code at the same time, giving you error. it gives errors bc some functions will relie on the data in the prev function
// Category.find({}, function(err, category){
//
//   Product.findOne({ category: category._id}, function(err, productSingle){
//     Product.findById({ _id: productSingle._id}, function(err, productSingleById){
//
//     });
//   });
// });

//waterfall is an array of functions, and the functions depend on each other ex [function, function, function]
async.waterfall([
  function(callback){
    Category.find({}, function(err, category){
      if(err) return next(err);
      callback(null, category); // callback: null when there is no error, then pass the category data--> then it calls for the next funtion below
    });
  },
  //pass in the category data from the last function
  function(category, callback){
    Product.findOne({category: category._id}, function(err, productSingle){ //when it finds the category, itll return the single product id
      if(err) return next(err);
      callback(null, productSingle);
    });
  },
  function(productSingle, callback){
    Product.findById({ _id: productSingle._id}, function(err, product){
      if(err) return next(err);
      res.render('');
      res.redirect
    });
  },
])

var router = require('express').Router();
var User = require('../models/user');
var Product = require('../models/product');
var Cart = require('../models/cart');

var async = require('async');

var stripe = require('stripe')('sk_test_RQKUH3z2qVcO9WW51WvNLlGI'); //require stripe library, and also put in your key

function paginate(req, res, next){
  var perPage = 9;
  var page= req.params.page;

  Product
    .find()
    .skip( perPage * page )
    .limit(perPage)
    .populate('category')
    .exec(function(err, products) {
      if (err) return next(err);
      Product.count().exec(function(err, count){
        if(err) return next(err);
        res.render('main/product-main', {
        products: products,
        pages: count / perPage
        });
      });
    })
}

//map product databse btwn elasticsearch and mongodb
Product.createMapping(function(err, mapping) {
  if (err) {
    console.log("error creating mapping");
    console.log(err);
  } else {
    console.log("Mapping created");
    console.log(mapping);
  }
});

//sync elasticsearch db
var stream = Product.synchronize();
var count = 0;

stream.on('data', function() {
  count++;
});

stream.on('close', function() {
  console.log("Indexed " + count + " documents");
});

stream.on('error', function(err) {
  console.log(err);
});

//redirect user to search route- go to a search route, and pass the req.body.q
router.post('/search', function(req, res, next) {
  res.redirect('/search?q=' + req.body.q);
});

//on the way of retrieving data from .post, use re.query.q
//ex if /search?q=hotdog = req.query.hotdog
//once you have the query name, now use the method .search to find it in the elasticsearch db
router.get('/search', function(req, res, next) {
  if (req.query.q) {
    Product.search({
      query_string: { query: req.query.q}
    }, function(err, results) {
      results:
      if (err) return next(err);
      var data = results.hits.hits.map(function(hit) {
        return hit;
      });
      res.render('main/search-result', {
        query: req.query.q,
        data: data
      });
    });
  }
});

router.get('/', function(req, res, next) {
  //if its the user, then home page is the product-main page
  if (req.user) {
    paginate(req, res, next);
  } else {
    res.render('main/home'); //else its the home page
  }

});

router.get('/page/:page', function(req, res, next) {
  paginate(req,res,next);
});

// render specific routes for each category page. the : means a specific category route. ex :food, :electronics. thats why we added a params id
//query products with the category id, based on the req.parents id
router.get('/products/:id', function(req, res, next){
  Product
    .find({ category: req.params.id})
    .populate('category')
    .exec(function(err, products){
      if (err) return next(err);
      res.render('main/category', {
        products: products
      });
    });
});

//single page for products
router.get('/product/:id', function(req, res, next) {
  Product.findById({ _id: req.params.id }, function(err, product) {
    if(err) return next(err);
    res.render('main/product', {
      product: product
    });
  });
});


// Cart router
router.get('/cart', function(req, res, next) {
  Cart
    .findOne({ owner: req.user._id })
    .populate('items.item')
    .exec(function(err, foundCart) {
      if (err) return next(err);
      res.render('main/cart', {
        foundCart: foundCart,
        message: req.flash('remove')
      });
    });
});

// Add items to cart
router.post('/product/:product_id', function(req, res, next){
  Cart.findOne({ owner: req.user._id}, function(err, cart){ // find owner of the cart, and if found,then push all the items they want to cart
    cart.items.push({
      item: req.body.product_id,
      price: parseFloat(req.body.priceValue),
      quantity: parseInt(req.body.quantity)
    });
    cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2); //total price to 2 decimal points ex 200.34

    cart.save(function(err){
      if(err) return next(err); //if error, throw err
      return res.redirect('/cart'); // if no error, then redirect to the cart page
    });
  });
});

//remove from cart in shopping cart basket
router.post('/remove', function(req, res, next) {
  Cart.findOne({ owner: req.user._id }, function(err, foundCart) {
    foundCart.items.pull(String(req.body.item));

    foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
    foundCart.save(function(err, found) {
      if (err) return next(err);
      req.flash('remove', 'Successfully removed');
      res.redirect('/cart');
    });
  });
});

//stripe payment
router.post('/payment', function(req, res, next) {

  var stripeToken = req.body.stripeToken;
  var currentCharges = Math.round(req.body.stripeMoney * 100);
  stripe.customers.create({
    source: stripeToken,
  }).then(function(customer) {
    return stripe.charges.create({
      amount: currentCharges,
      currency: 'usd',
      customer: customer.id
    });
  }).then(function(charge) {
    async.waterfall([
      function(callback) {
        Cart.findOne({ owner: req.user._id }, function(err, cart) {
          callback(err, cart);
        });
      },
      function(cart, callback) {
        User.findOne({ _id: req.user._id }, function(err, user) {
          if(user) {
            for (var i = 0; i < cart.items.length; i++) {
              user.history.push({
                item: cart.items[i].item,
                paid: cart.items[i].price
              });
            }

            user.save(function(err, user) {
              if (err) return next(err);
              callback(err, user);
            });
          }
        });
      },
      function(user) {
        Cart.update({ owner: user._id }, { $set: { items: [], total: 0 }}, function(err, updated) {
          if (updated) {
            res.redirect('/profile');
          }
        });
      }
    ]);
  });


});


module.exports = router;

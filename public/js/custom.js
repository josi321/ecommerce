
//Jquery search functionality
$(function(){

  Stripe.setPublishableKey('pk_test_47V7wk0r3jmPPmXJyecpsKRy');

  $('#search').keyup(function(){
    var search_term= $(this).val();

    $.ajax({
      method: 'POST', //sending data to server =post
      url: '/api/search',
      data: {
        search_term
      },
      dataType: 'json',
      success: function(json){
        var data= json.hits.hits.map(function(hit){
          return hit;
        });
        $('#searchResults').empty();
        for (var i= 0; i<data.length; i++){
          var html ="";
          html += '<div class="col-md-4">';
          html += '<a href="/product/' + data[i]._source._id +'">';
          html += '<div class="thumbnail">';
          html += '<img src="' +  data[i]._source.image +' ">';
          html += '<div class="caption">';
          html += '<h3>' +  data[i]._source.name  + '</h3>';
          html += '<p>' + data[i]._source.category.name  + '</p>';
          html += '<p>' +  data[i]._source.price  + '</p>';
          html += '</div></div></a></div>';

          $('#searchResults').append(html);
        }
        console.log(data);
      },
      error: function(error){
        console.log(err);
      }
    });
  });
});

//jquery for the add/delete buttons
$(document).on('click', '#plus', function(e){
  e.preventDefault();
  var priceValue = parseFloat($('#priceValue').val());
  var quantity = parseInt($('#quantity').val());

  priceValue += parseFloat($('#priceHidden').val());
  quantity +=1;

  $('#quantity').val(quantity);
  $('#priceValue').val(priceValue.toFixed(2));
  $('#total').html(quantity);
});

$(document).on('click', '#minus', function(e){
  e.preventDefault();
  var priceValue = parseFloat($('#priceValue').val());
  var quantity = parseInt($('#quantity').val());

  if(quantity == 1){
    priceValue = $('#priceHidden').val();
    quantity = 1;
  } else {
    priceValue -= parseFloat($('#priceHidden').val());
    quantity -=1;
  }

  $('#quantity').val(quantity);
  $('#priceValue').val(priceValue.toFixed(2));
  $('#total').html(quantity);
});

//stripe payment
function stripeResponseHandler(status, response) {
  var $form = $('#payment-form');

  if (response.error) {
    // Show the errors on the form
    $form.find('.payment-errors').text(response.error.message);
    $form.find('button').prop('disabled', false);
  } else {
    // response contains id and card, which contains additional card details
    var token = response.id;
    // Insert the token into the form so it gets submitted to the server
    $form.append($('<input type="hidden" name="stripeToken" />').val(token));

    // var spinner = new Spinner(opts).spin();
    // $('#loading').append(spinner.el);
    // and submit
    $form.get(0).submit();
  }
};


$('#payment-form').submit(function(event) {
  var $form = $(this);

  // Disable the submit button to prevent repeated clicks
  $form.find('button').prop('disabled', true);

  Stripe.card.createToken($form, stripeResponseHandler);

  // Prevent the form from submitting with the default action
  return false;
});
